import api from "./client";

export async function fetchStats() {
  const response = await api.get("/admin/stats");
  return response.data.stats;
}

// filters: { status, doctorId, date, search, page, pageSize }. Empty values are skipped.
// Returns { appointments, pagination }
export async function fetchAdminAppointments(filters) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== undefined && value !== null) {
      params[key] = value;
    }
  }
  const response = await api.get("/admin/appointments", { params });
  return response.data;
}

export async function updateAppointmentStatus(id, status) {
  const response = await api.patch("/admin/appointments/" + id + "/status", { status });
  return response.data.appointment;
}

export async function fetchAdminDoctors() {
  const response = await api.get("/admin/doctors");
  return response.data.doctors;
}

export async function createDoctor(body) {
  const response = await api.post("/admin/doctors", body);
  return response.data.doctor;
}

export async function updateDoctor(id, body) {
  const response = await api.put("/admin/doctors/" + id, body);
  return response.data.doctor;
}

// Returns { doctor, upcomingBookedAppointments, message }
export async function setDoctorStatus(id, isActive) {
  const response = await api.patch("/admin/doctors/" + id + "/status", { isActive });
  return response.data;
}

export async function setDoctorHours(id, workingHours) {
  const response = await api.put("/admin/doctors/" + id + "/working-hours", { workingHours });
  return response.data.doctor;
}

export async function deleteDoctor(id) {
  const response = await api.delete("/admin/doctors/" + id);
  return response.data;
}

export async function fetchAdminSpecialties() {
  const response = await api.get("/admin/specialties");
  return response.data.specialties;
}

export async function createSpecialty(name) {
  const response = await api.post("/admin/specialties", { name });
  return response.data.specialty;
}

export async function renameSpecialty(id, name) {
  const response = await api.put("/admin/specialties/" + id, { name });
  return response.data.specialty;
}

export async function deleteSpecialty(id) {
  const response = await api.delete("/admin/specialties/" + id);
  return response.data;
}