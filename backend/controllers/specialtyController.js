const prisma = require("../lib/prisma");

// GET /api/specialties
async function listSpecialties(req, res) {
  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  res.json({ specialties });
}

module.exports = { listSpecialties };