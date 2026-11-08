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
const { appointmentSelect, toAppointment } = require("../lib/appointmentFields");

// POST /api/appointments   body: { doctorId, date, startTime, reason }
async function createAppointment(req, res) {
  const body = req.body || {};

  const doctorId = parseId(body.doctorId);
  const date = body.date;
  const startTime = body.startTime;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  // 1. Check the shape of the input
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

  // 2. Rules 7 and 8: date window, and times that already passed today
  const dateError = checkBookableDate(date);
  if (dateError) throw new AppError(dateError, 400);
  if (isPastSlot(date, startTime)) {
    throw new AppError("That time has already passed.", 400);
  }

  // 3. The doctor must exist and be active
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
    select: { id: true },
  });
  if (!doctor) throw new AppError("Doctor not found.", 404);

  // 4. Rule 6: the time must be a real slot inside the doctor's working hours
  const hours = await prisma.doctorWorkingHours.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: dayOfWeekOf(date) } },
  });
  if (!hours) {
    throw new AppError("The doctor does not work on that day.", 400);
  }
  if (!generateSlots(hours.startTime, hours.endTime).includes(startTime)) {
    throw new AppError("That time is outside the doctor's working hours.", 400);
  }

  // 5. Rule 3: this patient cannot have two active appointments at the same time
  const dateValue = new Date(date + "T00:00:00.000Z");
  const patientBusy = await prisma.appointment.findFirst({
    where: { patientId: req.user.id, date: dateValue, startTime, status: "BOOKED" },
    select: { id: true },
  });
  if (patientBusy) {
    throw new AppError("You already have an appointment at that date and time.", 409);
  }

  // 6. Rule 2: save it. The unique slotKey makes double booking impossible.
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
    // Someone else booked the same slot a moment ago
    if (error.code === "P2002") {
      throw new AppError("Sorry, that time slot was just taken. Please choose another.", 409);
    }
    throw error;
  }
}

module.exports = { createAppointment };