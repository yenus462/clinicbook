// Sample data used until the backend is connected (Stage 9).
// The statuses match the project rules: BOOKED, COMPLETED, CANCELLED.

export const sampleAppointments = [
  {
    id: 1,
    patient: "Demo Patient",
    doctor: "Dr. Sara Ahmed",
    specialty: "General Practitioner",
    date: "2026-11-12",
    time: "09:30",
    reason: "General check-up",
    status: "BOOKED",
  },
  {
    id: 2,
    patient: "Demo Patient",
    doctor: "Dr. Daniel Bekele",
    specialty: "Cardiologist",
    date: "2026-11-16",
    time: "10:00",
    reason: "Blood pressure follow-up",
    status: "BOOKED",
  },
  {
    id: 3,
    patient: "Demo Patient",
    doctor: "Dr. Hanna Tesfaye",
    specialty: "Pediatrician",
    date: "2026-10-28",
    time: "11:00",
    reason: "Vaccination",
    status: "COMPLETED",
  },
  {
    id: 4,
    patient: "Demo Patient",
    doctor: "Dr. Samuel Girma",
    specialty: "Dermatologist",
    date: "2026-10-20",
    time: "13:30",
    reason: "Skin rash",
    status: "CANCELLED",
  },
  {
    id: 5,
    patient: "Abel Tadesse",
    doctor: "Dr. Sara Ahmed",
    specialty: "General Practitioner",
    date: "2026-11-12",
    time: "10:00",
    reason: "Fever and cough",
    status: "BOOKED",
  },
  {
    id: 6,
    patient: "Martha Hailu",
    doctor: "Dr. Daniel Bekele",
    specialty: "Cardiologist",
    date: "2026-11-13",
    time: "14:00",
    reason: "Chest discomfort",
    status: "BOOKED",
  },
];

export const sampleAdminDoctors = [
  { id: 1, name: "Dr. Sara Ahmed", specialty: "General Practitioner", active: true },
  { id: 2, name: "Dr. Daniel Bekele", specialty: "Cardiologist", active: true },
  { id: 3, name: "Dr. Hanna Tesfaye", specialty: "Pediatrician", active: true },
  { id: 4, name: "Dr. Samuel Girma", specialty: "Dermatologist", active: true },
];