// Seed script: inserts the starting data for ClinicBook.
// It is safe to run more than once (it never creates duplicates).

require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const specialtyNames = [
  "General Practitioner",
  "Cardiologist",
  "Pediatrician",
  "Dermatologist",
];

// days: 0 = Sunday ... 6 = Saturday
const doctorsData = [
  {
    name: "Dr. Sara Ahmed",
    specialty: "General Practitioner",
    description: "Family health, check-ups, and common illnesses.",
    days: [1, 2, 3, 4, 5],
    start: "09:00",
    end: "16:00",
  },
  {
    name: "Dr. Daniel Bekele",
    specialty: "Cardiologist",
    description: "Heart health, blood pressure, and chest pain.",
    days: [1, 3, 5],
    start: "10:00",
    end: "15:00",
  },
  {
    name: "Dr. Hanna Tesfaye",
    specialty: "Pediatrician",
    description: "Health care for babies, children, and teenagers.",
    days: [2, 4],
    start: "09:00",
    end: "14:00",
  },
  {
    name: "Dr. Samuel Girma",
    specialty: "Dermatologist",
    description: "Skin, hair, and nail conditions.",
    days: [1, 2, 3, 4],
    start: "11:00",
    end: "17:00",
  },
];

async function seedUsers() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      "Set ADMIN_PASSWORD in backend/.env (at least 8 characters) before seeding."
    );
  }

  // Admin accounts are created only here, never through public registration
  await prisma.user.upsert({
    where: { email: "admin@clinicbook.com" },
    update: {},
    create: {
      name: "Clinic Admin",
      email: "admin@clinicbook.com",
      passwordHash: await bcrypt.hash(adminPassword, SALT_ROUNDS),
      phone: "0911000000",
      role: "ADMIN",
    },
  });

  // A demo patient with a fake password, for testing and demos
  await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      name: "Demo Patient",
      email: "patient@example.com",
      passwordHash: await bcrypt.hash("Patient1234", SALT_ROUNDS),
      phone: "0911000001",
      role: "PATIENT",
    },
  });
}

async function seedSpecialties() {
  for (const name of specialtyNames) {
    await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function seedDoctors() {
  for (const d of doctorsData) {
    const specialty = await prisma.specialty.findUnique({
      where: { name: d.specialty },
    });

    // Doctors have no unique field, so we look them up by name first
    let doctor = await prisma.doctor.findFirst({ where: { name: d.name } });
    if (!doctor) {
      doctor = await prisma.doctor.create({
        data: {
          name: d.name,
          description: d.description,
          specialtyId: specialty.id,
        },
      });
    }

    for (const dayOfWeek of d.days) {
      await prisma.doctorWorkingHours.upsert({
        where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek } },
        update: {},
        create: {
          doctorId: doctor.id,
          dayOfWeek,
          startTime: d.start,
          endTime: d.end,
        },
      });
    }
  }
}

async function main() {
  await seedUsers();
  await seedSpecialties();
  await seedDoctors();

  const counts = {
    users: await prisma.user.count(),
    specialties: await prisma.specialty.count(),
    doctors: await prisma.doctor.count(),
    workingHours: await prisma.doctorWorkingHours.count(),
  };
  console.log("Seed finished:", counts);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });