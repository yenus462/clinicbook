const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { parseId } = require("../lib/adminValidators");
const { todayInClinic } = require("../lib/dates");
const { isValidDateString } = require("../lib/slots");

const STATUSES = ["BOOKED", "COMPLETED", "CANCELLED"];
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// What an admin may see. The patient's password hash is never selected.
const adminAppointmentSelect = {
  id: true,
  date: true,
  startTime: true,
  endTime: true,
  reason: true,
  status: true,
  createdAt: true,
  patient: { select: { id: true, name: true, email: true, phone: true } },
  doctor: {
    select: {
      id: true,
      name: true,
      specialty: { select: { id: true, name: true } },
    },
  },
};

function shape(appointment) {
  return { ...appointment, date: appointment.date.toISOString().slice(0, 10) };
}

function requireId(value) {
  const id = parseId(value);
  if (!id) throw new AppError("Appointment id must be a positive whole number.", 400);
  return id;
}

// Reads a positive whole number from the query string, or uses the default
function readPositiveInt(value, fallback, label) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new AppError(label + " must be a positive whole number.", 400);
  }
  return number;
}

// GET /api/admin/appointments
// Optional: ?status= &doctorId= &date= &search= &page= &pageSize=
async function listAppointments(req, res) {
  const query = req.query;
  const where = {};

  if (query.status !== undefined) {
    if (!STATUSES.includes(query.status)) {
      throw new AppError("status must be BOOKED, COMPLETED or CANCELLED.", 400);
    }
    where.status = query.status;
  }

  if (query.doctorId !== undefined) {
    const doctorId = parseId(query.doctorId);
    if (!doctorId) throw new AppError("doctorId must be a positive whole number.", 400);
    where.doctorId = doctorId;
  }

  if (query.date !== undefined) {
    if (!isValidDateString(query.date)) {
      throw new AppError("date must look like 2026-11-16.", 400);
    }
    where.date = new Date(query.date + "T00:00:00.000Z");
  }

  if (query.search !== undefined) {
    const search = typeof query.search === "string" ? query.search.trim() : "";
    if (search.length > 100) {
      throw new AppError("search is too long (maximum 100 characters).", 400);
    }
    if (search !== "") {
      // Matches the patient's name or email, or the doctor's name
      where.OR = [
        { patient: { name: { contains: search, mode: "insensitive" } } },
        { patient: { email: { contains: search, mode: "insensitive" } } },
        { doctor: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
  }

  const page = readPositiveInt(query.page, 1, "page");
  const pageSize = Math.min(
    readPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, "pageSize"),
    MAX_PAGE_SIZE
  );

  const [total, rows] = await prisma.$transaction([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: adminAppointmentSelect,
    }),
  ]);

  res.json({
    appointments: rows.map(shape),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

// GET /api/admin/appointments/:id
async function getAppointment(req, res) {
  const id = requireId(req.params.id);
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: adminAppointmentSelect,
  });
  if (!appointment) throw new AppError("Appointment not found.", 404);
  res.json({ appointment: shape(appointment) });
}

// PATCH /api/admin/appointments/:id/status   body: { "status": "COMPLETED" }
async function setAppointmentStatus(req, res) {
  const id = requireId(req.params.id);
  const { status } = req.body || {};

  if (status !== "COMPLETED" && status !== "CANCELLED") {
    throw new AppError("status must be COMPLETED or CANCELLED.", 400);
  }

  const current = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true, date: true },
  });
  if (!current) throw new AppError("Appointment not found.", 404);

  // Rule 13: COMPLETED and CANCELLED are final
  if (current.status !== "BOOKED") {
    throw new AppError(
      "Only BOOKED appointments can change status. COMPLETED and CANCELLED are final.",
      409
    );
  }

  // A visit cannot be completed before its day
  if (status === "COMPLETED" && current.date.toISOString().slice(0, 10) > todayInClinic()) {
    throw new AppError("An appointment cannot be completed before its date.", 400);
  }

  // The update only applies if the status is still BOOKED, so two admins
  // acting at the same moment cannot both succeed. slotKey becomes null (rule 9).
  const result = await prisma.appointment.updateMany({
    where: { id, status: "BOOKED" },
    data: { status, slotKey: null },
  });
  if (result.count === 0) {
    throw new AppError("This appointment was just changed by someone else.", 409);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: adminAppointmentSelect,
  });
  res.json({ appointment: shape(appointment) });
}

module.exports = { listAppointments, getAppointment, setAppointmentStatus };