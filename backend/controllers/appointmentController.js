const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { parseId } = require("../lib/adminValidators");
const { toMinutes, minutesToTime } = require("../lib/dates");
const {
  SLOT_MINUTES,
  isValidDateString,
  isValidTimeString,
  dayOfWeekOf,
  generateSlots,
  checkBookableDate,
  isPastSlot,
  makeSlotKey,
} = require("../lib/slots");
const { CHANGE_CUTOFF_MINUTES, minutesUntil } = require("../lib/appointmentRules");
const { appointmentSelect, toAppointment } = require("../lib/appointmentFields");

const STATUSES = ["BOOKED", "COMPLETED", "CANCELLED"];
const CUTOFF_MESSAGE =
  "Appointments cannot be cancelled or rescheduled within 2 hours of their start time.";

function requireId(value) {
  const id = parseId(value);
  if (!id) throw new AppError("Appointment id must be a positive whole number.", 400);
  return id;
}

// Rules 6, 7 and 8: the doctor must be active, and the date and time must be
// a real, future, bookable slot inside the working hours.
async function assertSlotAllowed(doctorId, date, startTime) {
  const dateError = checkBookableDate(date);
  if (dateError) throw new AppError(dateError, 400);
  if (isPastSlot(date, startTime)) {
    throw new AppError("That time has already passed.", 400);
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
    select: { id: true },
  });
  if (!doctor) throw new AppError("Doctor not found.", 404);

  const hours = await prisma.doctorWorkingHours.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: dayOfWeekOf(date) } },
  });
  if (!hours) {
    throw new AppError("The doctor does not work on that day.", 400);
  }
  if (!generateSlots(hours.startTime, hours.endTime).includes(startTime)) {
    throw new AppError("That time is outside the doctor's working hours.", 400);
  }
}

// Rule 3: finds another active appointment of this patient at the same time
function findPatientConflict(patientId, dateValue, startTime, ignoreId) {
  return prisma.appointment.findFirst({
    where: {
      patientId,
      date: dateValue,
      startTime,
      status: "BOOKED",
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true },
  });
}

// Rule 11: loads an appointment only if it belongs to the logged-in patient
async function findOwnAppointment(req) {
  const id = requireId(req.params.id);
  const appointment = await prisma.appointment.findFirst({
    where: { id, patientId: req.user.id },
    select: { id: true, doctorId: true, date: true, startTime: true, status: true },
  });
  if (!appointment) throw new AppError("Appointment not found.", 404);
  return appointment;
}

// Rules 10 and 13: only upcoming BOOKED appointments, more than 2 hours ahead
function assertCanChange(appointment) {
  if (appointment.status !== "BOOKED") {
    throw new AppError("Only booked appointments can be changed.", 409);
  }
  const dateString = appointment.date.toISOString().slice(0, 10);
  if (minutesUntil(dateString, appointment.startTime) < CHANGE_CUTOFF_MINUTES) {
    throw new AppError(CUTOFF_MESSAGE, 409);
  }
}

// POST /api/appointments   body: { doctorId, date, startTime, reason }
async function createAppointment(req, res) {
  const body = req.body || {};

  const doctorId = parseId(body.doctorId);
  const date = body.date;
  const startTime = body.startTime;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  const errors = [];
  if (!doctorId) errors.push("A valid doctorId is required.");
  if (!isValidDateString(date)) errors.push("date must look like 2026-11-16.");
  if (!isValidTimeString(startTime)) {
    errors.push("startTime must look like 09:00 or 09:30 (30-minute steps).");
  }
  if (reason.length < 3 || reason.length > 300) {
    errors.push("Reason must be between 3 and 300 characters.");
  }
  if (errors.length > 0) throw new AppError(errors.join(" "), 400);

  await assertSlotAllowed(doctorId, date, startTime);

  const dateValue = new Date(date + "T00:00:00.000Z");
  if (await findPatientConflict(req.user.id, dateValue, startTime)) {
    throw new AppError("You already have an appointment at that date and time.", 409);
  }

  const endTime = minutesToTime(toMinutes(startTime) + SLOT_MINUTES);

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user.id,
        doctorId,
        date: dateValue,
        startTime,
        endTime,
        reason,
        status: "BOOKED",
        slotKey: makeSlotKey(doctorId, date, startTime),
      },
      select: appointmentSelect,
    });

    res.status(201).json({ appointment: toAppointment(appointment) });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Sorry, that time slot was just taken. Please choose another.", 409);
    }
    throw error;
  }
}

// GET /api/appointments/me   (optional: ?status=BOOKED)
async function listMyAppointments(req, res) {
  const where = { patientId: req.user.id };

  if (req.query.status !== undefined) {
    if (!STATUSES.includes(req.query.status)) {
      throw new AppError("status must be BOOKED, COMPLETED or CANCELLED.", 400);
    }
    where.status = req.query.status;
  }

  const rows = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    select: appointmentSelect,
  });

  const appointments = rows.map((row) => {
    const appointment = toAppointment(row);
    return {
      ...appointment,
      // Tells the browser whether to enable Cancel and Reschedule
      canChange:
        appointment.status === "BOOKED" &&
        minutesUntil(appointment.date, appointment.startTime) >= CHANGE_CUTOFF_MINUTES,
    };
  });

  res.json({ appointments });
}

// PATCH /api/appointments/:id/cancel
async function cancelAppointment(req, res) {
  const current = await findOwnAppointment(req);
  assertCanChange(current);

  // slotKey becomes null, so the time slot is free again (rule 9)
  const appointment = await prisma.appointment.update({
    where: { id: current.id },
    data: { status: "CANCELLED", slotKey: null },
    select: appointmentSelect,
  });

  res.json({ appointment: toAppointment(appointment) });
}

// PATCH /api/appointments/:id/reschedule   body: { date, startTime }
async function rescheduleAppointment(req, res) {
  const body = req.body || {};
  const date = body.date;
  const startTime = body.startTime;

  const errors = [];
  if (!isValidDateString(date)) errors.push("date must look like 2026-11-16.");
  if (!isValidTimeString(startTime)) {
    errors.push("startTime must look like 09:00 or 09:30 (30-minute steps).");
  }
  if (errors.length > 0) throw new AppError(errors.join(" "), 400);

  const current = await findOwnAppointment(req);
  assertCanChange(current);

  const currentDate = current.date.toISOString().slice(0, 10);
  if (date === currentDate && startTime === current.startTime) {
    throw new AppError("Please choose a different date or time.", 400);
  }

  // Rule 14: check availability again before changing anything
  await assertSlotAllowed(current.doctorId, date, startTime);

  const dateValue = new Date(date + "T00:00:00.000Z");
  if (await findPatientConflict(req.user.id, dateValue, startTime, current.id)) {
    throw new AppError("You already have another appointment at that date and time.", 409);
  }

  const endTime = minutesToTime(toMinutes(startTime) + SLOT_MINUTES);

  try {
    // The new slotKey frees the old slot and protects the new one
    const appointment = await prisma.appointment.update({
      where: { id: current.id },
      data: {
        date: dateValue,
        startTime,
        endTime,
        slotKey: makeSlotKey(current.doctorId, date, startTime),
      },
      select: appointmentSelect,
    });

    res.json({ appointment: toAppointment(appointment) });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("Sorry, that time slot was just taken. Please choose another.", 409);
    }
    throw error;
  }
}

module.exports = {
  createAppointment,
  listMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
};