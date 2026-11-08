import api from "./client";

// Each function returns the data the backend sent: { user, token } or { user }

export async function loginRequest(email, password) {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}

export async function registerRequest(name, email, phone, password) {
  const response = await api.post("/auth/register", { name, email, phone, password });
  return response.data;
}

export async function meRequest() {
  const response = await api.get("/auth/me");
  return response.data;
}