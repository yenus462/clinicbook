// Checks appointment management end to end. The server must be running (npm run dev).
// It creates its own test doctors, a test patient and test appointments,
// and deletes them at the end.
// Usage:  npm run check:appointments

require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const {
  todayInClinic,
  clinicNow,
  addDays,
  toMinutes,
  minutesToTime,
} = require("../lib/dates");
const { makeSlotKey } = require("../lib/slots");

const BASE = "http://localhost:" + (process.env.PORT || 5000) + "/api";
let passed = 0;
let failed = 0;

function check(name, condition, extra) {
  if (condition) {
    passed++;
    console.log("PASS  " + name);
  } else {
    failed++;
    console.log("FAIL  " + name + (extra ? "  -> " + extra : ""));
  }
}

async function call(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }
  return { status: res.status, data };
}

// A test doctor who works every day from 00:00 to 23:30
function createTestDoctor(name, specialtyId) {
  return prisma.doctor.create({
    data: {
      name,
      description: "Automatic test doctor",
      specialtyId,
      workingHours: {
        create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: "00:00",
          endTime: "23:30",
        })),
      },
    },
  });
}

// Inserts an appointment directly, to test situations the API refuses to create
function insertAppointment(patientId, doctorId, date, startTime) {
  return prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      date: new Date(date + "T00:00:00.000Z"),
      startTime,
      endTime: minutesToTime(toMinutes(startTime) + 30),
      reason: "Automatic test",
      status: "BOOKED",
      slotKey: makeSlotKey(doctorId, date, startTime),
    },
  });
}

async function main() {
  if (!process.env.ADMIN_PASSWORD) {
    console.log("ADMIN_PASSWORD is not set in .env, cannot run.");
    process.exit(1);
  }

  const unique = Date.now();
  const today = todayInClinic();
  const yesterday = addDays(today, -1);
  const day3 = addDays(today, 3);
  const day4 = addDays(today, 4);
  const day5 = addDays(today, 5);

  const doctorIds = [];
  let patient2Id = null;

  try {
    const specialty = await prisma.specialty.findFirst();
    const doctorA = await createTestDoctor("Dr. Test A " + unique, specialty.id);
    const doctorB = await createTestDoctor("Dr. Test B " + unique, specialty.id);
    doctorIds.push(doctorA.id, doctorB.id);

    const patient1 = await prisma.user.findUnique({ where: { email: "patient@example.com" } });
    const patient2 = await prisma.user.create({
      data: {
        name: "Test Patient Two",
        email: "appt-test-" + unique + "@example.com",
        passwordHash: await bcrypt.hash("Test1234pass", 10),
        phone: "0911000002",
        role: "PATIENT",
      },
    });
    patient2Id = patient2.id;

    const login1 = await call("POST", "/auth/login", { email: "patient@example.com", password: "Patient1234" });
    const login2 = await call("POST", "/auth/login", { email: patient2.email, password: "Test1234pass" });
    const loginAdmin = await call("POST", "/auth/login", {
      email: "admin@clinicbook.com",
      password: process.env.ADMIN_PASSWORD,
    });
    const token1 = login1.data && login1.data.token;
    const token2 = login2.data && login2.data.token;
    const adminToken = loginAdmin.data && loginAdmin.data.token;

    if (!token1 || !token2 || !adminToken) {
      console.log("Could not log in. Restart the server to reset the rate limit, and check the seed data.");
      process.exitCode = 1;
      return;
    }

    // ---------- Setup: bookings through the real API ----------
    const bookA1 = await call("POST", "/appointments", { doctorId: doctorA.id, date: day3, startTime: "10:00", reason: "Test one" }, token1);
    const bookA2 = await call("POST", "/appointments", { doctorId: doctorA.id, date: day5, startTime: "11:00", reason: "Test two" }, token1);
    const bookB1 = await call("POST", "/appointments", { doctorId: doctorA.id, date: day3, startTime: "12:00", reason: "Patient two visit" }, token2);
    const bookDocB = await call("POST", "/appointments", { doctorId: doctorB.id, date: day4, startTime: "09:00", reason: "Other doctor" }, token1);
    check(
      "setup: four bookings were created (201)",
      [bookA1, bookA2, bookB1, bookDocB].every((b) => b.status === 201),
      [bookA1.status, bookA2.status, bookB1.status, bookDocB.status].join(",")
    );
    const a1 = bookA1.data.appointment;
    const a2 = bookA2.data.appointment;
    const b1 = bookB1.data.appointment;
    const b3 = bookDocB.data.appointment;

    // Past appointments inserted directly (the API refuses to create them)
    const pastP1 = await insertAppointment(patient1.id, doctorA.id, yesterday, "09:00");
    const pastP2 = await insertAppointment(patient2.id, doctorA.id, yesterday, "11:00");

    // ---------- Patient: listing ----------
    const noToken = await call("GET", "/appointments/me");
    check("my appointments without a token returns 401", noToken.status === 401, "got " + noToken.status);

    const asAdminList = await call("GET", "/appointments/me", null, adminToken);
    check("admin cannot use the patient list (403)", asAdminList.status === 403, "got " + asAdminList.status);

    const mine = await call("GET", "/appointments/me", null, token1);
    check("my appointments returns 200", mine.status === 200, "got " + mine.status);
    const mineList = (mine.data && mine.data.appointments) || [];
    check(
      "I see my own appointments",
      mineList.some((a) => a.id === a1.id) && mineList.some((a) => a.id === a2.id)
    );
    check("I never see another patient's appointment (rule 11)", !mineList.some((a) => a.id === b1.id));
    check(
      "upcoming appointment is changeable, past one is not",
      mineList.find((a) => a.id === a1.id).canChange === true &&
        mineList.find((a) => a.id === pastP1.id).canChange === false
    );

    const badStatus = await call("GET", "/appointments/me?status=NOPE", null, token1);
    check("invalid status filter returns 400", badStatus.status === 400, "got " + badStatus.status);

    const completedOnly = await call("GET", "/appointments/me?status=COMPLETED", null, token1);
    check(
      "status filter works",
      completedOnly.status === 200 && completedOnly.data.appointments.every((a) => a.status === "COMPLETED")
    );

    // ---------- Patient: cancel rejections ----------
    const cancelOthers = await call("PATCH", "/appointments/" + b1.id + "/cancel", null, token1);
    check("cannot cancel another patient's appointment (404)", cancelOthers.status === 404, "got " + cancelOthers.status);

    const cancelBadId = await call("PATCH", "/appointments/abc/cancel", null, token1);
    check("cancel with a bad id returns 400", cancelBadId.status === 400, "got " + cancelBadId.status);

    const cancelNoToken = await call("PATCH", "/appointments/" + a1.id + "/cancel");
    check("cancel without a token returns 401", cancelNoToken.status === 401, "got " + cancelNoToken.status);

    const cancelPast = await call("PATCH", "/appointments/" + pastP1.id + "/cancel", null, token1);
    check("cannot cancel a past appointment (409, rule 10)", cancelPast.status === 409, "got " + cancelPast.status);

    const reschedulePast = await call(
      "PATCH",
      "/appointments/" + pastP1.id + "/reschedule",
      { date: day3, startTime: "15:00" },
      token1
    );
    check("cannot reschedule a past appointment (409, rule 10)", reschedulePast.status === 409, "got " + reschedulePast.status);

    // The 2-hour cut-off: an appointment starting 60 to 90 minutes from now
    const now = clinicNow();
    const soonMinutes = Math.ceil((now.minutes + 60) / 30) * 30;
    if (soonMinutes <= 23 * 60 + 30) {
      const soon = await insertAppointment(patient1.id, doctorA.id, today, minutesToTime(soonMinutes));
      const cancelSoon = await call("PATCH", "/appointments/" + soon.id + "/cancel", null, token1);
      check("cannot cancel within 2 hours (409, rule 10)", cancelSoon.status === 409, "got " + cancelSoon.status);
      const rescheduleSoon = await call(
        "PATCH",
        "/appointments/" + soon.id + "/reschedule",
        { date: day3, startTime: "14:00" },
        token1
      );
      check("cannot reschedule within 2 hours (409, rule 10)", rescheduleSoon.status === 409, "got " + rescheduleSoon.status);
    } else {
      console.log("SKIP  2-hour cut-off checks (too close to midnight to create a test slot)");
    }

    // ---------- Patient: cancel ----------
    const cancelOk = await call("PATCH", "/appointments/" + a1.id + "/cancel", null, token1);
    check("cancel own appointment returns 200", cancelOk.status === 200, "got " + cancelOk.status);
    check("cancelled appointment has status CANCELLED", cancelOk.data && cancelOk.data.appointment.status === "CANCELLED");

    const slotsAfterCancel = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day3);
    check("cancelled slot is free again (rule 9)", slotsAfterCancel.data && slotsAfterCancel.data.slots.includes("10:00"));

    const cancelTwice = await call("PATCH", "/appointments/" + a1.id + "/cancel", null, token1);
    check("cancelling twice returns 409", cancelTwice.status === 409, "got " + cancelTwice.status);

    // ---------- Patient: reschedule ----------
    const moved = await call("PATCH", "/appointments/" + a2.id + "/reschedule", { date: day3, startTime: "10:00" }, token1);
    check("reschedule to a free slot returns 200", moved.status === 200, "got " + moved.status);
    check(
      "rescheduled appointment has the new date and times",
      moved.data &&
        moved.data.appointment.date === day3 &&
        moved.data.appointment.startTime === "10:00" &&
        moved.data.appointment.endTime === "10:30"
    );

    const oldSlot = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day5);
    check("the old slot was released", oldSlot.data && oldSlot.data.slots.includes("11:00"));

    const takenSlot = await call("PATCH", "/appointments/" + a2.id + "/reschedule", { date: day3, startTime: "12:00" }, token1);
    check("reschedule to a taken slot returns 409", takenSlot.status === 409, "got " + takenSlot.status);

    const sameSlot = await call("PATCH", "/appointments/" + a2.id + "/reschedule", { date: day3, startTime: "10:00" }, token1);
    check("reschedule to the same slot returns 400", sameSlot.status === 400, "got " + sameSlot.status);

    const toPast = await call("PATCH", "/appointments/" + a2.id + "/reschedule", { date: yesterday, startTime: "10:00" }, token1);
    check("reschedule to the past returns 400", toPast.status === 400, "got " + toPast.status);

    const outsideHours = await call("PATCH", "/appointments/" + a2.id + "/reschedule", { date: day3, startTime: "23:30" }, token1);
    check("reschedule outside working hours returns 400", outsideHours.status === 400, "got " + outsideHours.status);

    const badTime = await call("PATCH", "/appointments/" + a2.id + "/reschedule", { date: day3, startTime: "10:15" }, token1);
    check("reschedule with a bad time returns 400", badTime.status === 400, "got " + badTime.status);

    const moveOthers = await call("PATCH", "/appointments/" + b1.id + "/reschedule", { date: day3, startTime: "13:00" }, token1);
    check("cannot reschedule another patient's appointment (404)", moveOthers.status === 404, "got " + moveOthers.status);

    const moveCancelled = await call("PATCH", "/appointments/" + a1.id + "/reschedule", { date: day3, startTime: "13:00" }, token1);
    check("cannot reschedule a cancelled appointment (409)", moveCancelled.status === 409, "got " + moveCancelled.status);

    const patientBusy = await call("PATCH", "/appointments/" + b3.id + "/reschedule", { date: day3, startTime: "10:00" }, token1);
    check("cannot move onto my own other booking (409, rule 3)", patientBusy.status === 409, "got " + patientBusy.status);

    // ---------- Admin: access ----------
    const adminNoToken = await call("GET", "/admin/appointments");
    check("admin list without a token returns 401", adminNoToken.status === 401, "got " + adminNoToken.status);

    const adminAsPatient = await call("GET", "/admin/appointments", null, token1);
    check("patient is blocked from the admin list (403)", adminAsPatient.status === 403, "got " + adminAsPatient.status);

    // ---------- Admin: list, filters, pagination ----------
    const listA = await call("GET", "/admin/appointments?doctorId=" + doctorA.id, null, adminToken);
    check("admin list returns 200", listA.status === 200, "got " + listA.status);
    check(
      "list is filtered by doctor and counts at least 5",
      listA.data &&
        listA.data.appointments.every((a) => a.doctor.id === doctorA.id) &&
        listA.data.pagination.total >= 5
    );
    check(
      "list shows patient contact but no password data",
      listA.data &&
        listA.data.appointments[0].patient.email &&
        !JSON.stringify(listA.data).toLowerCase().includes("passwordhash")
    );

    const paged = await call("GET", "/admin/appointments?doctorId=" + doctorA.id + "&pageSize=2&page=2", null, adminToken);
    check(
      "pagination returns the requested page size",
      paged.status === 200 &&
        paged.data.appointments.length === 2 &&
        paged.data.pagination.page === 2 &&
        paged.data.pagination.totalPages >= 3
    );

    const searched = await call("GET", "/admin/appointments?search=" + encodeURIComponent("Test A " + unique), null, adminToken);
    check(
      "search by doctor name works",
      searched.status === 200 &&
        searched.data.appointments.length > 0 &&
        searched.data.appointments.every((a) => a.doctor.id === doctorA.id)
    );

    const searchPatient = await call("GET", "/admin/appointments?search=" + encodeURIComponent(patient2.email), null, adminToken);
    check(
      "search by patient email works",
      searchPatient.status === 200 &&
        searchPatient.data.appointments.length > 0 &&
        searchPatient.data.appointments.every((a) => a.patient.id === patient2.id)
    );

    const byDate = await call("GET", "/admin/appointments?doctorId=" + doctorA.id + "&date=" + day3, null, adminToken);
    check(
      "filter by date works",
      byDate.status === 200 && byDate.data.appointments.length >= 2 && byDate.data.appointments.every((a) => a.date === day3)
    );

    const byStatus = await call("GET", "/admin/appointments?doctorId=" + doctorA.id + "&status=BOOKED", null, adminToken);
    check(
      "filter by status works",
      byStatus.status === 200 && byStatus.data.appointments.every((a) => a.status === "BOOKED")
    );

    const badPage = await call("GET", "/admin/appointments?page=0", null, adminToken);
    check("page=0 returns 400", badPage.status === 400, "got " + badPage.status);
    const badAdminStatus = await call("GET", "/admin/appointments?status=NOPE", null, adminToken);
    check("invalid status returns 400", badAdminStatus.status === 400, "got " + badAdminStatus.status);
    const badAdminDate = await call("GET", "/admin/appointments?date=2026-99-99", null, adminToken);
    check("invalid date returns 400", badAdminDate.status === 400, "got " + badAdminDate.status);
    const badDoctorId = await call("GET", "/admin/appointments?doctorId=abc", null, adminToken);
    check("invalid doctorId returns 400", badDoctorId.status === 400, "got " + badDoctorId.status);

    // ---------- Admin: details ----------
    const detail = await call("GET", "/admin/appointments/" + a2.id, null, adminToken);
    check(
      "admin can view appointment details",
      detail.status === 200 && detail.data.appointment.patient.email === "patient@example.com"
    );
    const detailMissing = await call("GET", "/admin/appointments/99999999", null, adminToken);
    check("unknown appointment returns 404", detailMissing.status === 404, "got " + detailMissing.status);

    // ---------- Admin: status changes (rule 13) ----------
    const toBooked = await call("PATCH", "/admin/appointments/" + a2.id + "/status", { status: "BOOKED" }, adminToken);
    check("status BOOKED is refused (400)", toBooked.status === 400, "got " + toBooked.status);

    const toNonsense = await call("PATCH", "/admin/appointments/" + a2.id + "/status", { status: "WHATEVER" }, adminToken);
    check("unknown status is refused (400)", toNonsense.status === 400, "got " + toNonsense.status);

    const completeFuture = await call("PATCH", "/admin/appointments/" + a2.id + "/status", { status: "COMPLETED" }, adminToken);
    check("cannot complete a future appointment (400)", completeFuture.status === 400, "got " + completeFuture.status);

    const completePast = await call("PATCH", "/admin/appointments/" + pastP2.id + "/status", { status: "COMPLETED" }, adminToken);
    check(
      "admin can complete a past appointment (200)",
      completePast.status === 200 && completePast.data.appointment.status === "COMPLETED",
      "got " + completePast.status
    );

    const completedToCancelled = await call("PATCH", "/admin/appointments/" + pastP2.id + "/status", { status: "CANCELLED" }, adminToken);
    check("COMPLETED cannot change to CANCELLED (409)", completedToCancelled.status === 409, "got " + completedToCancelled.status);

    const adminCancel = await call("PATCH", "/admin/appointments/" + b1.id + "/status", { status: "CANCELLED" }, adminToken);
    check("admin can cancel a booked appointment (200)", adminCancel.status === 200, "got " + adminCancel.status);

    const cancelledToCompleted = await call("PATCH", "/admin/appointments/" + b1.id + "/status", { status: "COMPLETED" }, adminToken);
    check("CANCELLED cannot change to COMPLETED (409)", cancelledToCompleted.status === 409, "got " + cancelledToCompleted.status);

    const slotsAfterAdminCancel = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day3);
    check("admin-cancelled slot is free again", slotsAfterAdminCancel.data && slotsAfterAdminCancel.data.slots.includes("12:00"));

    const keyRow = await prisma.appointment.findUnique({ where: { id: b1.id }, select: { slotKey: true } });
    check("slotKey is cleared on cancellation", keyRow && keyRow.slotKey === null);

    // ---------- Admin: stats ----------
    const stats = await call("GET", "/admin/stats", null, adminToken);
    check("stats returns 200", stats.status === 200, "got " + stats.status);
    const s = stats.data && stats.data.stats;
    check(
      "stats numbers are consistent",
      s &&
        typeof s.byStatus.BOOKED === "number" &&
        s.total === s.byStatus.BOOKED + s.byStatus.COMPLETED + s.byStatus.CANCELLED &&
        s.activeDoctors >= 4 &&
        s.patients >= 2 &&
        s.upcomingBooked >= 1
    );

    const statsAsPatient = await call("GET", "/admin/stats", null, token1);
    check("patient is blocked from stats (403)", statsAsPatient.status === 403, "got " + statsAsPatient.status);
  } finally {
    // Remove all test data, even if a check above crashed
    if (doctorIds.length > 0) {
      await prisma.appointment.deleteMany({ where: { doctorId: { in: doctorIds } } });
      await prisma.doctor.deleteMany({ where: { id: { in: doctorIds } } });
    }
    if (patient2Id) {
      await prisma.appointment.deleteMany({ where: { patientId: patient2Id } });
      await prisma.user.deleteMany({ where: { id: patient2Id } });
    }
    await prisma.$disconnect();
  }

  console.log("\nResult: " + passed + " passed, " + failed + " failed");
  process.exit(failed === 0 && process.exitCode !== 1 ? 0 : 1);
}

main().catch((error) => {
  console.error("Could not run the checks. Is the server running? ", error.message);
  process.exit(1);
});