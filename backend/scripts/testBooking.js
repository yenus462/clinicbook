// Checks availability and booking end to end. The server must be running (npm run dev).
// It creates its own test doctors and a test patient, and deletes them at the end.
// Usage:  npm run check:booking

require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const { todayInClinic, addDays } = require("../lib/dates");

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

// A test doctor that works every day from 00:00 to 23:30 (or has no hours at all)
function createTestDoctor(name, specialtyId, withHours) {
  return prisma.doctor.create({
    data: {
      name,
      description: "Automatic test doctor",
      specialtyId,
      workingHours: withHours
        ? {
            create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
              dayOfWeek,
              startTime: "00:00",
              endTime: "23:30",
            })),
          }
        : undefined,
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
  const day30 = addDays(today, 30);
  const day31 = addDays(today, 31);

  const doctorIds = [];
  let patient2Id = null;

  try {
    const specialty = await prisma.specialty.findFirst();
    const doctorA = await createTestDoctor("Dr. Test A " + unique, specialty.id, true);
    const doctorB = await createTestDoctor("Dr. Test B " + unique, specialty.id, true);
    const doctorC = await createTestDoctor("Dr. Test C " + unique, specialty.id, false);
    doctorIds.push(doctorA.id, doctorB.id, doctorC.id);

    // A second patient, created directly in the database
    const patient2 = await prisma.user.create({
      data: {
        name: "Test Patient Two",
        email: "booking-test-" + unique + "@example.com",
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

    // ---------- Availability ----------
    const noDate = await call("GET", "/doctors/" + doctorA.id + "/slots");
    check("slots without a date returns 400", noDate.status === 400, "got " + noDate.status);

    const fakeDate = await call("GET", "/doctors/" + doctorA.id + "/slots?date=2026-13-45");
    check("slots with an impossible date returns 400", fakeDate.status === 400, "got " + fakeDate.status);

    const pastDay = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + yesterday);
    check("slots for yesterday returns 400 (rule 7)", pastDay.status === 400, "got " + pastDay.status);

    const tooFar = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day31);
    check("slots for day 31 returns 400 (rule 8)", tooFar.status === 400, "got " + tooFar.status);

    const lastDay = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day30);
    check("slots for day 30 returns 200 (rule 8 boundary)", lastDay.status === 200, "got " + lastDay.status);

    const unknownDoc = await call("GET", "/doctors/99999999/slots?date=" + day3);
    check("slots for an unknown doctor returns 404", unknownDoc.status === 404, "got " + unknownDoc.status);

    const noHours = await call("GET", "/doctors/" + doctorC.id + "/slots?date=" + day3);
    check(
      "doctor without working hours is not working that day",
      noHours.status === 200 && noHours.data.isWorkingDay === false && noHours.data.slots.length === 0
    );

    const slots1 = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day3);
    check("slots for a working day returns 200", slots1.status === 200, "got " + slots1.status);
    check(
      "slots are 30-minute steps inside the hours (47 slots, 00:00 to 23:00)",
      slots1.data &&
        slots1.data.slots.length === 47 &&
        slots1.data.slots.includes("10:00") &&
        !slots1.data.slots.includes("23:30")
    );

    const slotsToday = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + today);
    check(
      "today's slots hide times that already started (rule 7)",
      slotsToday.status === 200 && !slotsToday.data.slots.includes("00:00")
    );

    // ---------- Booking: rejections ----------
    const goodBody = { doctorId: doctorA.id, date: day3, startTime: "10:00", reason: "Automatic test" };

    const noToken = await call("POST", "/appointments", goodBody);
    check("booking without a token returns 401", noToken.status === 401, "got " + noToken.status);

    const asAdmin = await call("POST", "/appointments", goodBody, adminToken);
    check("admin cannot book (403)", asAdmin.status === 403, "got " + asAdmin.status);

    const noReason = await call("POST", "/appointments", { ...goodBody, reason: " " }, token1);
    check("missing reason returns 400", noReason.status === 400, "got " + noReason.status);

    const oddTime = await call("POST", "/appointments", { ...goodBody, startTime: "10:15" }, token1);
    check("time not on a 30-minute step returns 400", oddTime.status === 400, "got " + oddTime.status);

    const pastBooking = await call("POST", "/appointments", { ...goodBody, date: yesterday }, token1);
    check("booking yesterday returns 400 (rule 7)", pastBooking.status === 400, "got " + pastBooking.status);

    const pastTime = await call("POST", "/appointments", { ...goodBody, date: today, startTime: "00:00" }, token1);
    check("booking a time that already passed today returns 400", pastTime.status === 400, "got " + pastTime.status);

    const farBooking = await call("POST", "/appointments", { ...goodBody, date: day31 }, token1);
    check("booking beyond 30 days returns 400 (rule 8)", farBooking.status === 400, "got " + farBooking.status);

    const unknownBooking = await call("POST", "/appointments", { ...goodBody, doctorId: 99999999 }, token1);
    check("booking an unknown doctor returns 404", unknownBooking.status === 404, "got " + unknownBooking.status);

    const offDay = await call("POST", "/appointments", { ...goodBody, doctorId: doctorC.id }, token1);
    check("booking a doctor with no hours that day returns 400", offDay.status === 400, "got " + offDay.status);

    // ---------- Booking: success and conflicts ----------
    const booked1 = await call("POST", "/appointments", goodBody, token1);
    check("valid booking returns 201", booked1.status === 201, "got " + booked1.status);
    const appointment = booked1.data && booked1.data.appointment;
    check(
      "booking is BOOKED, 30 minutes, with plain-text date",
      appointment &&
        appointment.status === "BOOKED" &&
        appointment.startTime === "10:00" &&
        appointment.endTime === "10:30" &&
        appointment.date === day3
    );
    check(
      "booking response has no password data",
      !JSON.stringify(booked1.data).toLowerCase().includes("password")
    );

    const slots2 = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day3);
    check("booked slot disappears from the free list", slots2.data && !slots2.data.slots.includes("10:00"));

    const takenSlot = await call("POST", "/appointments", goodBody, token2);
    check("another patient cannot take the same slot (409, rule 2)", takenSlot.status === 409, "got " + takenSlot.status);

    const overlap = await call("POST", "/appointments", { ...goodBody, doctorId: doctorB.id }, token1);
    check("same patient cannot book two doctors at one time (409, rule 3)", overlap.status === 409, "got " + overlap.status);

    const otherTime = await call("POST", "/appointments", { ...goodBody, doctorId: doctorB.id, startTime: "10:30" }, token1);
    check("same patient can book a different time (201)", otherTime.status === 201, "got " + otherTime.status);

    // ---------- Rule 9: a cancelled appointment releases its slot ----------
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED", slotKey: null },
    });

    const slots3 = await call("GET", "/doctors/" + doctorA.id + "/slots?date=" + day3);
    check("cancelled slot is free again (rule 9)", slots3.data && slots3.data.slots.includes("10:00"));

    const rebooked = await call("POST", "/appointments", goodBody, token2);
    check("another patient can now book the released slot (201)", rebooked.status === 201, "got " + rebooked.status);

    // ---------- Inactive doctors ----------
    await prisma.doctor.update({ where: { id: doctorB.id }, data: { isActive: false } });

    const inactiveBooking = await call("POST", "/appointments", { ...goodBody, doctorId: doctorB.id, startTime: "11:00" }, token1);
    check("inactive doctor cannot be booked (404)", inactiveBooking.status === 404, "got " + inactiveBooking.status);

    const inactiveSlots = await call("GET", "/doctors/" + doctorB.id + "/slots?date=" + day3);
    check("inactive doctor has no slots (404)", inactiveSlots.status === 404, "got " + inactiveSlots.status);
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