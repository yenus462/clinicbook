// Checks the admin API end to end. The server must be running (npm run dev).
// It creates its own test data and deletes it at the end.
// Usage:  npm run check:admin

require("dotenv").config();
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

async function main() {
  if (!process.env.ADMIN_PASSWORD) {
    console.log("ADMIN_PASSWORD is not set in .env, cannot run.");
    process.exit(1);
  }

  const adminLogin = await call("POST", "/auth/login", {
    email: "admin@clinicbook.com",
    password: process.env.ADMIN_PASSWORD,
  });
  const patientLogin = await call("POST", "/auth/login", {
    email: "patient@example.com",
    password: "Patient1234",
  });
  const adminToken = adminLogin.data && adminLogin.data.token;
  const patientToken = patientLogin.data && patientLogin.data.token;

  if (!adminToken || !patientToken) {
    console.log("Could not log in as admin and demo patient. Restart the server to reset the rate limit, and check the seed data.");
    process.exit(1);
  }

  const unique = Date.now();
  let specialtyId;
  let doctorId;

  try {
    // 1. Access control
    const noToken = await call("GET", "/admin/doctors");
    check("no token returns 401", noToken.status === 401, "got " + noToken.status);

    const asPatient = await call("GET", "/admin/doctors", null, patientToken);
    check("patient is blocked (403)", asPatient.status === 403, "got " + asPatient.status);

    const list = await call("GET", "/admin/doctors", null, adminToken);
    check("admin can list doctors (200)", list.status === 200, "got " + list.status);
    check(
      "admin list has the seeded doctors with isActive",
      list.data && list.data.doctors.length >= 4 && typeof list.data.doctors[0].isActive === "boolean"
    );

    // 2. Specialties
    const specName = "Test Specialty " + unique;
    const createSpec = await call("POST", "/admin/specialties", { name: specName }, adminToken);
    check("create specialty returns 201", createSpec.status === 201, "got " + createSpec.status);
    specialtyId = createSpec.data && createSpec.data.specialty && createSpec.data.specialty.id;

    const dupSpec = await call("POST", "/admin/specialties", { name: specName.toUpperCase() }, adminToken);
    check("duplicate specialty name (any case) returns 409", dupSpec.status === 409, "got " + dupSpec.status);

    const emptySpec = await call("POST", "/admin/specialties", { name: " " }, adminToken);
    check("empty specialty name returns 400", emptySpec.status === 400, "got " + emptySpec.status);

    const renamed = await call("PUT", "/admin/specialties/" + specialtyId, { name: specName + " Updated" }, adminToken);
    check("rename specialty returns 200", renamed.status === 200, "got " + renamed.status);

    // 3. Doctors
    const badDoctor = await call("POST", "/admin/doctors", { name: "A", description: "x", specialtyId }, adminToken);
    check("invalid doctor data returns 400", badDoctor.status === 400, "got " + badDoctor.status);

    const noSpecialty = await call(
      "POST",
      "/admin/doctors",
      { name: "Dr. Test Nobody", description: "Test doctor description", specialtyId: 999999 },
      adminToken
    );
    check("unknown specialtyId returns 400", noSpecialty.status === 400, "got " + noSpecialty.status);

    const targetDate = addDays(todayInClinic(), 14);
    const dow = new Date(targetDate + "T00:00:00.000Z").getUTCDay();

    const createDoc = await call(
      "POST",
      "/admin/doctors",
      {
        name: "Dr. Test " + unique,
        description: "Automatic test doctor",
        specialtyId,
        workingHours: [{ dayOfWeek: dow, startTime: "09:00", endTime: "12:00" }],
      },
      adminToken
    );
    check("create doctor returns 201", createDoc.status === 201, "got " + createDoc.status);
    doctorId = createDoc.data && createDoc.data.doctor && createDoc.data.doctor.id;
    check(
      "new doctor has its working hours",
      createDoc.data && createDoc.data.doctor && createDoc.data.doctor.workingHours.length === 1
    );

    const publicView = await call("GET", "/doctors/" + doctorId);
    check("active doctor is visible to the public (200)", publicView.status === 200, "got " + publicView.status);

    // 4. Working hours validation
    const hoursUrl = "/admin/doctors/" + doctorId + "/working-hours";

    const endBeforeStart = await call(
      "PUT",
      hoursUrl,
      { workingHours: [{ dayOfWeek: dow, startTime: "12:00", endTime: "09:00" }] },
      adminToken
    );
    check("end before start returns 400", endBeforeStart.status === 400, "got " + endBeforeStart.status);

    const oddMinutes = await call(
      "PUT",
      hoursUrl,
      { workingHours: [{ dayOfWeek: dow, startTime: "09:15", endTime: "12:00" }] },
      adminToken
    );
    check("time not on 30-minute step returns 400", oddMinutes.status === 400, "got " + oddMinutes.status);

    const repeatedDay = await call(
      "PUT",
      hoursUrl,
      {
        workingHours: [
          { dayOfWeek: dow, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: dow, startTime: "13:00", endTime: "15:00" },
        ],
      },
      adminToken
    );
    check("repeated weekday returns 400", repeatedDay.status === 400, "got " + repeatedDay.status);

    // 5. Rule 16: existing bookings are protected. We insert a booking directly.
    const patient = await prisma.user.findUnique({ where: { email: "patient@example.com" } });
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        date: new Date(targetDate + "T00:00:00.000Z"),
        startTime: "10:00",
        endTime: "10:30",
        reason: "Automatic test",
        slotKey: doctorId + "_" + targetDate + "_10:00",
      },
    });

    const tooLate = await call(
      "PUT",
      hoursUrl,
      { workingHours: [{ dayOfWeek: dow, startTime: "11:00", endTime: "12:00" }] },
      adminToken
    );
    check("hours that exclude a booking are refused (409)", tooLate.status === 409, "got " + tooLate.status);

    const otherDay = await call(
      "PUT",
      hoursUrl,
      { workingHours: [{ dayOfWeek: (dow + 1) % 7, startTime: "09:00", endTime: "12:00" }] },
      adminToken
    );
    check("removing the booked weekday is refused (409)", otherDay.status === 409, "got " + otherDay.status);

    const okHours = await call(
      "PUT",
      hoursUrl,
      { workingHours: [{ dayOfWeek: dow, startTime: "09:30", endTime: "12:00" }] },
      adminToken
    );
    check("hours that still include the booking are accepted (200)", okHours.status === 200, "got " + okHours.status);
    check(
      "new hours were saved",
      okHours.data && okHours.data.doctor.workingHours[0].startTime === "09:30"
    );

    // 6. Deleting and deactivating
    const delSpecWithDoctor = await call("DELETE", "/admin/specialties/" + specialtyId, null, adminToken);
    check("specialty with a doctor cannot be deleted (409)", delSpecWithDoctor.status === 409, "got " + delSpecWithDoctor.status);

    const updated = await call(
      "PUT",
      "/admin/doctors/" + doctorId,
      { name: "Dr. Test Renamed " + unique, description: "Updated description", specialtyId },
      adminToken
    );
    check("update doctor returns 200", updated.status === 200, "got " + updated.status);

    const delDoctor = await call("DELETE", "/admin/doctors/" + doctorId, null, adminToken);
    check("doctor with appointments cannot be deleted (409)", delDoctor.status === 409, "got " + delDoctor.status);

    const deactivate = await call("PATCH", "/admin/doctors/" + doctorId + "/status", { isActive: false }, adminToken);
    check("deactivate doctor returns 200", deactivate.status === 200, "got " + deactivate.status);
    check(
      "deactivate reports the upcoming booking",
      deactivate.data && deactivate.data.upcomingBookedAppointments === 1
    );

    const hiddenOne = await call("GET", "/doctors/" + doctorId);
    check("inactive doctor is hidden from the public (404)", hiddenOne.status === 404, "got " + hiddenOne.status);

    const publicList = await call("GET", "/doctors");
    check(
      "inactive doctor is missing from the public list",
      publicList.data && !publicList.data.doctors.some((d) => d.id === doctorId)
    );

    const badStatus = await call("PATCH", "/admin/doctors/" + doctorId + "/status", { isActive: "no" }, adminToken);
    check("non-boolean isActive returns 400", badStatus.status === 400, "got " + badStatus.status);

    const reactivate = await call("PATCH", "/admin/doctors/" + doctorId + "/status", { isActive: true }, adminToken);
    check("reactivate doctor returns 200", reactivate.status === 200, "got " + reactivate.status);

    // 7. Clean up: remove the test booking, doctor and specialty
    await prisma.appointment.deleteMany({ where: { doctorId } });

    const delDoctorNow = await call("DELETE", "/admin/doctors/" + doctorId, null, adminToken);
    check("doctor without appointments can be deleted (200)", delDoctorNow.status === 200, "got " + delDoctorNow.status);

    const delSpecNow = await call("DELETE", "/admin/specialties/" + specialtyId, null, adminToken);
    check("empty specialty can be deleted (200)", delSpecNow.status === 200, "got " + delSpecNow.status);

    const gone = await call("GET", "/admin/doctors/" + doctorId, null, adminToken);
    check("deleted doctor returns 404", gone.status === 404, "got " + gone.status);
  } finally {
    // Safety net: remove test data even if a check above crashed.
    // The guards matter: a missing id must never reach a delete.
    if (doctorId) {
      await prisma.appointment.deleteMany({ where: { doctorId } });
      await prisma.doctor.deleteMany({ where: { id: doctorId } });
    }
    if (specialtyId) {
      await prisma.specialty.deleteMany({ where: { id: specialtyId } });
    }
    await prisma.$disconnect();
  }

  console.log("\nResult: " + passed + " passed, " + failed + " failed");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Could not run the checks. Is the server running? ", error.message);
  process.exit(1);
});