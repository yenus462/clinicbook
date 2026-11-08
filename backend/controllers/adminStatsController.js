const prisma = require("../lib/prisma");
const { todayInClinic } = require("../lib/dates");

// GET /api/admin/stats
async function getStats(req, res) {
  const today = new Date(todayInClinic() + "T00:00:00.000Z");

  const [grouped, activeDoctors, patients, bookedToday, upcomingBooked] = await Promise.all([
    prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "PATIENT" } }),
    prisma.appointment.count({ where: { status: "BOOKED", date: today } }),
    prisma.appointment.count({ where: { status: "BOOKED", date: { gte: today } } }),
  ]);

  const byStatus = { BOOKED: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const row of grouped) {
    byStatus[row.status] = row._count._all;
  }
  const total = byStatus.BOOKED + byStatus.COMPLETED + byStatus.CANCELLED;

  res.json({
    stats: { total, byStatus, activeDoctors, patients, bookedToday, upcomingBooked },
  });
}

module.exports = { getStats };