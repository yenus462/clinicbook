const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { todayInClinic, toMinutes } = require("../lib/dates");
const {
  parseId,
  validateDoctor,
  validateWorkingHours,
} = require("../lib/adminValidators");

// Everything an admin may see about a doctor
const adminDoctorSelect = {
  id: true,
  name: true,
  description: true,
  photoUrl: true,
  isActive: true,
  createdAt: true,
  specialty: { select: { id: true, name: true } },
  workingHours: {
    select: { dayOfWeek: true, startTime: true, endTime: true },
    orderBy: { dayOfWeek: "asc" },
  },
  _count: { select: { appointments: true } },
};

// Replaces the internal _count with a friendly appointmentCount
function shape(doctor) {
  const { _count, ...rest } = doctor;
  return { ...rest, appointmentCount: _count.appointments };
}

// Midnight (UTC) of today's date in the clinic, to compare with @db.Date columns
function startOfToday() {
  return new Date(todayInClinic() + "T00:00:00.000Z");
}

function requireId(value) {
  const id = parseId(value);
  if (!id) throw new AppError("Doctor id must be a positive whole number.", 400);
  return id;
}

async function requireDoctor(id) {
  const doctor = await prisma.doctor.findUnique({ where: { id }, select: { id: true } });
  if (!doctor) throw new AppError("Doctor not found.", 404);
}

async function requireSpecialty(id) {
  const specialty = await prisma.specialty.findUnique({ where: { id }, select: { id: true } });
  if (!specialty) throw new AppError("Specialty not found.", 400);
}

// Rule 16: finds upcoming BOOKED appointments that the new schedule would break
async function findConflicts(doctorId, newHours) {
  const upcoming = await prisma.appointment.findMany({
    where: { doctorId, status: "BOOKED", date: { gte: startOfToday() } },
    select: { id: true, date: true, startTime: true, endTime: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const hoursByDay = new Map(newHours.map((h) => [h.dayOfWeek, h]));

  return upcoming.filter((appointment) => {
    const hours = hoursByDay.get(appointment.date.getUTCDay());
    if (!hours) return true; // the doctor no longer works that day
    return (
      toMinutes(appointment.startTime) < toMinutes(hours.startTime) ||
      toMinutes(appointment.endTime) > toMinutes(hours.endTime)
    );
  });
}

// GET /api/admin/doctors
async function listDoctors(req, res) {
  const doctors = await prisma.doctor.findMany({
    orderBy: { name: "asc" },
    select: adminDoctorSelect,
  });
  res.json({ doctors: doctors.map(shape) });
}

// GET /api/admin/doctors/:id
async function getDoctor(req, res) {
  const id = requireId(req.params.id);
  const doctor = await prisma.doctor.findUnique({ where: { id }, select: adminDoctorSelect });
  if (!doctor) throw new AppError("Doctor not found.", 404);
  res.json({ doctor: shape(doctor) });
}

// POST /api/admin/doctors  (workingHours is optional)
async function createDoctor(req, res) {
  const body = req.body || {};
  const { errors, values } = validateDoctor(body);

  let hours = [];
  if (body.workingHours !== undefined) {
    const result = validateWorkingHours(body.workingHours);
    errors.push(...result.errors);
    hours = result.hours;
  }
  if (errors.length > 0) throw new AppError(errors.join(" "), 400);

  await requireSpecialty(values.specialtyId);

  // The doctor and the schedule are saved together or not at all
  const doctor = await prisma.doctor.create({
    data: {
      name: values.name,
      description: values.description,
      photoUrl: values.photoUrl,
      specialtyId: values.specialtyId,
      workingHours: { create: hours },
    },
    select: adminDoctorSelect,
  });

  res.status(201).json({ doctor: shape(doctor) });
}

// PUT /api/admin/doctors/:id
async function updateDoctor(req, res) {
  const id = requireId(req.params.id);
  const { errors, values } = validateDoctor(req.body || {});
  if (errors.length > 0) throw new AppError(errors.join(" "), 400);

  await requireDoctor(id);
  await requireSpecialty(values.specialtyId);

  const doctor = await prisma.doctor.update({
    where: { id },
    data: values,
    select: adminDoctorSelect,
  });

  res.json({ doctor: shape(doctor) });
}

// PATCH /api/admin/doctors/:id/status   body: { "isActive": false }
async function setDoctorStatus(req, res) {
  const id = requireId(req.params.id);
  const { isActive } = req.body || {};

  if (typeof isActive !== "boolean") {
    throw new AppError("isActive must be true or false.", 400);
  }
  await requireDoctor(id);

  const doctor = await prisma.doctor.update({
    where: { id },
    data: { isActive },
    select: adminDoctorSelect,
  });

  // Tell the admin if booked patients are affected by a deactivation
  const upcomingBooked = await prisma.appointment.count({
    where: { doctorId: id, status: "BOOKED", date: { gte: startOfToday() } },
  });

  res.json({
    doctor: shape(doctor),
    upcomingBookedAppointments: upcomingBooked,
    message: isActive
      ? "Doctor is active and can be booked again."
      : "Doctor is hidden from patients. Existing bookings were not changed.",
  });
}

// PUT /api/admin/doctors/:id/working-hours   body: { "workingHours": [...] }
async function setWorkingHours(req, res) {
  const id = requireId(req.params.id);
  const { errors, hours } = validateWorkingHours((req.body || {}).workingHours);
  if (errors.length > 0) throw new AppError(errors.join(" "), 400);

  await requireDoctor(id);

  // Rule 16: never silently break existing bookings
  const conflicts = await findConflicts(id, hours);
  if (conflicts.length > 0) {
    const list = conflicts
      .slice(0, 10)
      .map((a) => a.date.toISOString().slice(0, 10) + " " + a.startTime)
      .join(", ");
    throw new AppError(
      "These booked appointments would fall outside the new hours: " +
        list +
        ". Reschedule or cancel them first.",
      409
    );
  }

  // Delete the old schedule and insert the new one in one transaction
  await prisma.$transaction([
    prisma.doctorWorkingHours.deleteMany({ where: { doctorId: id } }),
    prisma.doctorWorkingHours.createMany({
      data: hours.map((h) => ({ ...h, doctorId: id })),
    }),
  ]);

  const doctor = await prisma.doctor.findUnique({ where: { id }, select: adminDoctorSelect });
  res.json({ doctor: shape(doctor) });
}

// DELETE /api/admin/doctors/:id
async function deleteDoctor(req, res) {
  const id = requireId(req.params.id);
  await requireDoctor(id);

  // Rule 15: a doctor with appointment history is deactivated, not deleted
  const appointmentCount = await prisma.appointment.count({ where: { doctorId: id } });
  if (appointmentCount > 0) {
    throw new AppError(
      "This doctor has appointment history and cannot be deleted. Deactivate the doctor instead.",
      409
    );
  }

  await prisma.doctor.delete({ where: { id } });
  res.json({ message: "Doctor deleted." });
}

module.exports = {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  setDoctorStatus,
  setWorkingHours,
  deleteDoctor,
};