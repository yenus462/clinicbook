// Checks the auth API end to end. The server must be running (npm run dev).
// Usage:  npm run check:auth

require("dotenv").config();

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
  const email = "test" + Date.now() + "@example.com";
  const password = "Test1234pass";

  // 1. Register. We also try to sneak in role ADMIN, which must be ignored.
  const reg = await call("POST", "/auth/register", {
    name: "Test Patient",
    email,
    phone: "0911000009",
    password,
    role: "ADMIN",
  });
  check("register returns 201", reg.status === 201, "got " + reg.status);
  check("register returns a token", typeof (reg.data && reg.data.token) === "string");
  check("register role is PATIENT (role in body ignored)", reg.data && reg.data.user && reg.data.user.role === "PATIENT");
  check("register response has no password data", !JSON.stringify(reg.data).toLowerCase().includes("password"));

  // 2. Duplicate email
  const dup = await call("POST", "/auth/register", {
    name: "Test Patient",
    email,
    phone: "0911000009",
    password,
  });
  check("duplicate email returns 409", dup.status === 409, "got " + dup.status);

  // 3. Short password
  const short = await call("POST", "/auth/register", {
    name: "Test Patient",
    email: "short" + Date.now() + "@example.com",
    phone: "0911000009",
    password: "abc123",
  });
  check("short password returns 400", short.status === 400, "got " + short.status);

  // 4. Wrong password and unknown email give the same answer
  const wrongPass = await call("POST", "/auth/login", { email, password: "WrongPassword1" });
  const unknown = await call("POST", "/auth/login", { email: "nobody" + Date.now() + "@example.com", password });
  check("wrong password returns 401", wrongPass.status === 401, "got " + wrongPass.status);
  check("unknown email returns 401", unknown.status === 401, "got " + unknown.status);
  check(
    "both failures use the same message",
    wrongPass.data && unknown.data && wrongPass.data.error.message === unknown.data.error.message
  );

  // 5. Correct login
  const login = await call("POST", "/auth/login", { email, password });
  check("login returns 200", login.status === 200, "got " + login.status);
  const token = login.data && login.data.token;
  check("login returns a token", typeof token === "string");

  // 6. /me
  const noToken = await call("GET", "/auth/me");
  check("/me without token returns 401", noToken.status === 401, "got " + noToken.status);

  const badToken = await call("GET", "/auth/me", null, "not.a.real.token");
  check("/me with a fake token returns 401", badToken.status === 401, "got " + badToken.status);

  const me = await call("GET", "/auth/me", null, token);
  check("/me with a valid token returns 200", me.status === 200, "got " + me.status);
  check("/me returns the right email", me.data && me.data.user && me.data.user.email === email);
  check("/me has no password data", !JSON.stringify(me.data).toLowerCase().includes("password"));

  // 7. Role protection
  const patientPing = await call("GET", "/auth/admin-ping", null, token);
  check("patient is blocked from admin route (403)", patientPing.status === 403, "got " + patientPing.status);

  // 8. Admin
  if (process.env.ADMIN_PASSWORD) {
    const adminLogin = await call("POST", "/auth/login", {
      email: "admin@clinicbook.com",
      password: process.env.ADMIN_PASSWORD,
    });
    check("admin login returns 200", adminLogin.status === 200, "got " + adminLogin.status);
    check("admin role is ADMIN", adminLogin.data && adminLogin.data.user && adminLogin.data.user.role === "ADMIN");

    const adminPing = await call("GET", "/auth/admin-ping", null, adminLogin.data && adminLogin.data.token);
    check("admin can use admin route (200)", adminPing.status === 200, "got " + adminPing.status);
  } else {
    console.log("SKIP  admin checks (ADMIN_PASSWORD not set in .env)");
  }

  console.log("\nResult: " + passed + " passed, " + failed + " failed");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Could not run the checks. Is the server running? ", error.message);
  process.exit(1);
});