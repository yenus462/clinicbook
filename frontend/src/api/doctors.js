import api from "./client";

export async function fetchDoctors() {
  const response = await api.get("/doctors");
  return response.data.doctors;
}

export async function fetchDoctor(id) {
  const response = await api.get("/doctors/" + id);
  return response.data.doctor;
}

// Returns [{ id, name }, ...]
export async function fetchSpecialties() {
  const response = await api.get("/specialties");
  return response.data.specialties;
}

// Returns { doctorId, date, isWorkingDay, slots: ["09:00", ...] }
export async function fetchSlots(doctorId, date) {
  const response = await api.get("/doctors/" + doctorId + "/slots", { params: { date } });
  return response.data;
}