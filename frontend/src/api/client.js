import axios from "axios";

const TOKEN_KEY = "clinicbook_token";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Reading and writing the login token. Wrapped in try/catch because
// browsers can block storage (for example in private mode).
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage blocked: the user will simply need to log in again after a refresh.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

// The auth context registers a function here that logs the user out
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Before every request: attach the token if we have one
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

// After every response: if the server says "not logged in", end the session.
// Login and register are excluded, because a wrong password also returns 401.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response && error.response.status;
    const url = (error.config && error.config.url) || "";
    const isAuthForm = url.startsWith("/auth/login") || url.startsWith("/auth/register");

    if (status === 401 && !isAuthForm && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

// Turns any error into a message that is safe and useful to show on screen
export function getErrorMessage(error) {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error.message;
  }
  if (error.request) {
    return "Cannot reach the server. Please check that the backend is running.";
  }
  return "Something went wrong. Please try again.";
}

export default api;