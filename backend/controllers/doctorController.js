const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");

// The fields we send to the browser. Nothing else leaves the server.
const doctorSelect = {
  id: true,
  name: true,
  description: true,
  photoUrl: true,
  specialty: { select: { id: true, name: true } },
  workingHours: {
    select: { dayOfWeek: true, startTime: true, endTime: true },
    orderBy: { dayOfWeek: "asc" },
  },
};

// Turns text like "3" into the number 3, or returns null if it is not a positive whole number
function parseId(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

// GET /api/doctors  (optional: ?specialtyId=2&search=sara)
async function listDoctors(req, res) {
  const { specialtyId, search } = req.query;

  // Patients only see active doctors (rule 15)
  const where = { isActive: true };

  if (specialtyId !== undefined) {
    const id = parseId(specialtyId);
    if (!id) {
      throw new AppError("specialtyId must be a positive whole number.", 400);
    }
    where.specialtyId = id;
  }

  if (typeof search === "string" && search.trim() !== "") {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }

  const doctors = await prisma.doctor.findMany({
    where,
    orderBy: { name: "asc" },
    select: doctorSelect,
  });

  res.json({ doctors });
}

// GET /api/doctors/:id
async function getDoctor(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    throw new AppError("Doctor id must be a positive whole number.", 400);
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id, isActive: true },
    select: doctorSelect,
  });

  if (!doctor) {
    throw new AppError("Doctor not found.", 404);
  }

  res.json({ doctor });
}

module.exports = { listDoctors, getDoctor };