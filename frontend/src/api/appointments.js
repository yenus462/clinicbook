import api from "./client";

// body: { doctorId, date, startTime, reason }
export async function bookAppointment(body) {
  const response = await api.post("/appointments", body);
  return response.data.appointment;
}

export async function fetchMyAppointments() {
  const response = await api.get("/appointments/me");
  return response.data.appointments;
}

export async function cancelMyAppointment(id) {
  const response = await api.patch("/appointments/" + id + "/cancel");
  return response.data.appointment;
}

export async function rescheduleMyAppointment(id, date, startTime) {
  const response = await api.patch("/appointments/" + id + "/reschedule", { date, startTime });
  return response.data.appointment;
}