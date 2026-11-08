const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { parseId, validateSpecialtyName } = require("../lib/adminValidators");

// Finds a specialty with the same name, ignoring upper and lower case
async function findByName(name) {
  return prisma.specialty.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
}

// GET /api/admin/specialties
async function listSpecialties(req, res) {
  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { doctors: true } } },
  });

  res.json({
    specialties: specialties.map((s) => ({
      id: s.id,
      name: s.name,
      doctorCount: s._count.doctors,
    })),
  });
}

// POST /api/admin/specialties
async function createSpecialty(req, res) {
  const { errors, values } = validateSpecialtyName(req.body || {});
  if (errors.length > 0) throw new AppError(errors.join(" "), 400);

  if (await findByName(values.name)) {
    throw new AppError("A specialty with this name already exists.", 409);
  }

  const specialty = await prisma.specialty.create({
    data: { name: values.name },
    select: { id: true, name: true },
  });

  res.status(201).json({ specialty });
}

// PUT /api/admin/specialties/:id
async function updateSpecialty(req, res) {
  const id = parseId(req.params.id);
  if (!id) throw new AppError("Specialty id must be a positive whole number.", 400);

  const { errors, values } = validateSpecialtyName(req.body || {});
  if (errors.length > 0) throw new AppError(errors.join(" "), 400);

  const current = await prisma.specialty.findUnique({ where: { id } });
  if (!current) throw new AppError("Specialty not found.", 404);

  const sameName = await findByName(values.name);
  if (sameName && sameName.id !== id) {
    throw new AppError("A specialty with this name already exists.", 409);
  }

  const specialty = await prisma.specialty.update({
    where: { id },
    data: { name: values.name },
    select: { id: true, name: true },
  });

  res.json({ specialty });
}

// DELETE /api/admin/specialties/:id
async function deleteSpecialty(req, res) {
  const id = parseId(req.params.id);
  if (!id) throw new AppError("Specialty id must be a positive whole number.", 400);

  const current = await prisma.specialty.findUnique({ where: { id } });
  if (!current) throw new AppError("Specialty not found.", 404);

  const doctorCount = await prisma.doctor.count({ where: { specialtyId: id } });
  if (doctorCount > 0) {
    throw new AppError(
      "This specialty still has doctors. Move or remove them first.",
      409
    );
  }

  await prisma.specialty.delete({ where: { id } });
  res.json({ message: "Specialty deleted." });
}

module.exports = {
  listSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
};