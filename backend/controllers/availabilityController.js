const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { parseId } = require("../lib/adminValidators");
const {
  isValidDateString,
  dayOfWeekOf,
  generateSlots,
  checkBookableDate,
  isPastSlot,
} = require("../lib/slots");

// GET /api/doctors/:id/slots?date=2026-11-16
async function getDoctorSlots(req, res) {
  const doctorId = parseId(req.params.id);
  if (!doctorId) {
    throw new AppError("Doctor id must be a positive whole number.", 400);
  }

  const date = req.query.date;
  if (!isValidDateString(date)) {
    throw new AppError("date is required and must look like 2026-11-16.", 400);
  }
  const dateError = checkBookableDate(date);
  if (dateError) {
    throw new AppError(dateError, 400);
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
    select: { id: true, name: true },
  });
  if (!doctor) {
    throw new AppError("Doctor not found.", 404);
  }

  // Does the doctor work on this weekday?
  const hours = await prisma.doctorWorkingHours.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: dayOfWeekOf(date) } },
  });
  if (!hours) {
    return res.json({ doctorId, date, isWorkingDay: false, slots: [] });
  }

  // Slots already taken by BOOKED appointments (cancelled ones do not count, rule 9)
  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: new Date(date + "T00:00:00.000Z"),
      status: "BOOKED",
    },
    select: { startTime: true },
  });
  const bookedTimes = new Set(booked.map((a) => a.startTime));

  const slots = generateSlots(hours.startTime, hours.endTime).filter(
    (time) => !bookedTimes.has(time) && !isPastSlot(date, time)
  );

  res.json({ doctorId, date, isWorkingDay: true, slots });
}

module.exports = { getDoctorSlots };