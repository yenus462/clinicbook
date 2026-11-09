// Security checks against the running API (npm run dev must be running).
// It uses only the seeded demo accounts and fake tokens built here.
// Usage:  npm run check:security
// This script should run LAST, because it deliberately triggers the login rate limit.

require("dotenv").config();
const jwt = require("jsonwebtoken");

const ROOT = "http://localhost:" + (process.env.PORT || 5000);
const BASE = ROOT + "/api";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
const AUTH_LIMIT = Number(process.env.AUTH_RATE_LIMIT) || 10;

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

async function raw(method, url, { body, token, headers = {}, rawBody } = {}) {
  const h = { ...headers };
  if (rawBody === undefined && body !== undefined) h["Content-Type"] = "application/json";
  if (rawBody !== undefined) h["Content-Type"] = "application/json";
  if (token) h.Authorization = "Bearer " + token;

  const res = await fetch(url, {
    method,
    headers: h,
    body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    data = null;
  }
  return { status: res.status, headers: res.headers, text, data };
}

async function main() {
  if (!process.env.ADMIN_PASSWORD) {
    console.log("ADMIN_PASSWORD is not set in .env, cannot run.");
    process.exit(1);
  }

  // ---------- Headers ----------
  const health = await raw("GET", BASE + "/health");
  check("health check returns 200", health.status === 200, "got " + health.status);
  check("X-Powered-By header is hidden", !health.headers.has("x-powered-by"));
  check("X-Content-Type-Options is nosniff", health.headers.get("x-content-type-options") === "nosniff");
  check("Content-Security-Policy header is present", health.headers.has("content-security-policy"));

  // The health route is registered before the limiter, so we test a limited route
  const limitedRoute = await raw("GET", BASE + "/specialties");
  check(
    "rate limit headers are present",
    limitedRoute.headers.has("ratelimit") || limitedRoute.headers.has("ratelimit-policy")
  );

  // ---------- CORS ----------
  const allowed = await raw("GET", BASE + "/health", { headers: { Origin: FRONTEND } });
  check(
    "CORS allows the frontend origin",
    allowed.headers.get("access-control-allow-origin") === FRONTEND
  );
  const blocked = await raw("GET", BASE + "/health", { headers: { Origin: "http://evil.example.com" } });
  check(
    "CORS does not allow other origins",
    blocked.headers.get("access-control-allow-origin") !== "http://evil.example.com" &&
      blocked.headers.get("access-control-allow-origin") !== "*"
  );

  // ---------- Logins ----------
  const patientLogin = await raw("POST", BASE + "/auth/login", {
    body: { email: "patient@example.com", password: "Patient1234" },
  });
  const adminLogin = await raw("POST", BASE + "/auth/login", {
    body: { email: "admin@clinicbook.com", password: process.env.ADMIN_PASSWORD },
  });
  const patientToken = patientLogin.data && patientLogin.data.token;
  const adminToken = adminLogin.data && adminLogin.data.token;

  if (!patientToken || !adminToken) {
    console.log("Could not log in. Restart the server to reset the rate limit, and check the seed data.");
    process.exit(1);
  }

  // ---------- No secrets in responses ----------
  const urls = [
    ["GET", "/auth/me", patientToken],
    ["GET", "/doctors", null],
    ["GET", "/appointments/me", patientToken],
    ["GET", "/admin/doctors", adminToken],
    ["GET", "/admin/appointments", adminToken],
    ["GET", "/admin/stats", adminToken],
  ];
  let leaked = false;
  for (const [method, path, token] of urls) {
    const r = await raw(method, BASE + path, { token });
    if (/passwordhash|"password"/i.test(r.text)) leaked = true;
  }
  check("no response contains passwordHash or password fields", !leaked);
  check(
    "login response contains no password data",
    !/passwordhash|"password"/i.test(patientLogin.text) && !/passwordhash|"password"/i.test(adminLogin.text)
  );

  // ---------- Token attacks ----------
  const secret = process.env.JWT_SECRET;
  const forged = jwt.sign({ role: "ADMIN" }, "a-completely-wrong-secret-that-is-long-enough", {
    subject: "1",
    algorithm: "HS256",
  });
  const forgedRes = await raw("GET", BASE + "/admin/stats", { token: forged });
  check("token signed with a wrong secret is rejected (401)", forgedRes.status === 401, "got " + forgedRes.status);

  const expired = jwt.sign({ role: "ADMIN" }, secret, { subject: "1", expiresIn: -60, algorithm: "HS256" });
  const expiredRes = await raw("GET", BASE + "/admin/stats", { token: expired });
  check("expired token is rejected (401)", expiredRes.status === 401, "got " + expiredRes.status);

  const noneToken =
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url") +
    "." +
    Buffer.from(JSON.stringify({ sub: "1", role: "ADMIN" })).toString("base64url") +
    ".";
  const noneRes = await raw("GET", BASE + "/admin/stats", { token: noneToken });
  check('token with algorithm "none" is rejected (401)', noneRes.status === 401, "got " + noneRes.status);

  const hs512 = jwt.sign({ role: "ADMIN" }, secret, { subject: "1", algorithm: "HS512" });
  const hs512Res = await raw("GET", BASE + "/admin/stats", { token: hs512 });
  check("token with a different algorithm is rejected (401)", hs512Res.status === 401, "got " + hs512Res.status);

  // A valid signature that claims ADMIN for a patient: the database role must win
  const patientId = Number(jwt.decode(patientToken).sub);
  const claimsAdmin = jwt.sign({ role: "ADMIN" }, secret, { subject: String(patientId), algorithm: "HS256" });
  const claimsRes = await raw("GET", BASE + "/admin/stats", { token: claimsAdmin });
  check("a patient token claiming ADMIN is still blocked (403)", claimsRes.status === 403, "got " + claimsRes.status);

  const basic = await raw("GET", BASE + "/auth/me", { headers: { Authorization: "Basic abc" } });
  check("non-Bearer authorization is rejected (401)", basic.status === 401, "got " + basic.status);

  // ---------- Input attacks ----------
  const bigBody = await raw("POST", BASE + "/auth/login", {
    body: { email: "a@b.co", password: "x".repeat(20000) },
  });
  check("oversized body is refused (413)", bigBody.status === 413, "got " + bigBody.status);

  const badJson = await raw("POST", BASE + "/auth/login", { rawBody: "{ not valid json" });
  check("malformed JSON returns 400 with a safe message", badJson.status === 400 && badJson.data && badJson.data.error, "got " + badJson.status);

  const sqlish = await raw("POST", BASE + "/auth/login", {
    body: { email: "' OR '1'='1", password: "' OR '1'='1" },
  });
  check("SQL-style input does not log anyone in", sqlish.status === 400 || sqlish.status === 401, "got " + sqlish.status);

  const objectEmail = await raw("POST", BASE + "/auth/login", {
    body: { email: { contains: "" }, password: "Patient1234" },
  });
  check("object instead of text for email is refused", objectEmail.status === 400 || objectEmail.status === 401, "got " + objectEmail.status);

  const stackLeak = await raw("GET", BASE + "/doctors/abc");
  check("error responses never include stack traces", !/\bat\s+\S+\s+\(.*:\d+:\d+\)/.test(stackLeak.text));

  const missing = await raw("GET", BASE + "/does-not-exist");
  check("unknown route returns 404 JSON", missing.status === 404 && missing.data && missing.data.error);

  // Registering cannot create an admin, and mass assignment is ignored
  const reg = await raw("POST", BASE + "/auth/register", {
    body: {
      name: "Sec Test",
      email: "sec" + Date.now() + "@example.com",
      phone: "0911000004",
      password: "Test1234pass",
      role: "ADMIN",
      id: 1,
    },
  });
  check("register ignores a role in the body", reg.status === 201 && reg.data.user.role === "PATIENT", "got " + reg.status);

  // ---------- Rate limit (this deliberately fills the limit, so it runs last) ----------
  let limited = false;
  const tries = AUTH_LIMIT + 5;
  for (let i = 0; i < tries; i++) {
    const r = await raw("POST", BASE + "/auth/login", {
      body: { email: "ratelimit@example.com", password: "WrongPassword1" },
    });
    if (r.status === 429) {
      limited = true;
      break;
    }
  }
  check("repeated login attempts are rate limited (429)", limited);
  console.log("NOTE  The login limit is now used up. Restart the backend before using the app or other checks.");

  console.log("\nResult: " + passed + " passed, " + failed + " failed");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Could not run the checks. Is the server running? ", error.message);
  process.exit(1);
});