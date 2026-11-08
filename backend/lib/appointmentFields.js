// What an appointment looks like when sent to the browser.
// Task 10 reuses this for listing appointments.

const appointmentSelect = {
  id: true,
  date: true,
  startTime: true,
  endTime: true,
  reason: true,
  status: true,
  createdAt: true,
  doctor: {
    select: {
      id: true,
      name: true,
      specialty: { select: { id: true, name: true } },
    },
  },
};

// Turns the stored date into plain text like "2026-11-16"
function toAppointment(appointment) {
  return {
    ...appointment,
    date: appointment.date.toISOString().slice(0, 10),
  };
}

module.exports = { appointmentSelect, toAppointment };