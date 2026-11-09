// Checks the profile endpoint. The server must be running (npm run dev).
// It creates its own test user and deletes it at the end.
// Usage:  npm run check:profile

require("dotenv").config();
const prisma = require("../lib/prisma");

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

// Reads the user from a response without crashing when the response is an error
function userOf(response) {
  return response.data && response.data.user ? response.data.user : {};
}

async function main() {
  const email = "profile-test-" + Date.now() + "@example.com";

  try {
    const noToken = await call("PATCH", "/auth/me", { name: "New Name", phone: "0911000005" });
    check("update without a token returns 401", noToken.status === 401, "got " + noToken.status);

    const reg = await call("POST", "/auth/register", {
      name: "Profile Tester",
      email,
      phone: "0911000004",
      password: "Test1234pass",
    });
    const token = reg.data && reg.data.token;
    if (!token) {
      console.log("Could not register the test user (status " + reg.status + "). Restart the server to reset the rate limit.");
      process.exitCode = 1;
      return;
    }

    // "+251911000005" is 13 characters, inside the 7 to 15 limit
    const ok = await call("PATCH", "/auth/me", { name: "  Updated Name  ", phone: "+251911000005" }, token);
    check("valid update returns 200", ok.status === 200, "got " + ok.status);
    check(
      "name is trimmed and phone is saved",
      userOf(ok).name === "Updated Name" && userOf(ok).phone === "+251911000005"
    );
    check("update response has no password data", !JSON.stringify(ok.data).toLowerCase().includes("password"));

    const sneaky = await call(
      "PATCH",
      "/auth/me",
      { name: "Still Patient", phone: "0911000006", role: "ADMIN", email: "hacker@example.com", id: 1 },
      token
    );
    check("update returns 200 even with extra fields", sneaky.status === 200, "got " + sneaky.status);
    check(
      "role and email cannot be changed (mass assignment ignored)",
      userOf(sneaky).role === "PATIENT" && userOf(sneaky).email === email
    );

    const shortName = await call("PATCH", "/auth/me", { name: "A", phone: "0911000006" }, token);
    check("too short name returns 400", shortName.status === 400, "got " + shortName.status);

    const badPhone = await call("PATCH", "/auth/me", { name: "Valid Name", phone: "abc" }, token);
    check("invalid phone returns 400", badPhone.status === 400, "got " + badPhone.status);

    const longPhone = await call("PATCH", "/auth/me", { name: "Valid Name", phone: "1234567890123456" }, token);
    check("phone longer than 15 characters returns 400", longPhone.status === 400, "got " + longPhone.status);

    const objectName = await call("PATCH", "/auth/me", { name: { x: 1 }, phone: "0911000006" }, token);
    check("object instead of text returns 400", objectName.status === 400, "got " + objectName.status);

    const me = await call("GET", "/auth/me", null, token);
    check(
      "the saved changes are visible on /me",
      me.status === 200 && userOf(me).name === "Still Patient" && userOf(me).phone === "0911000006"
    );
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }

  console.log("\nResult: " + passed + " passed, " + failed + " failed");
  process.exit(failed === 0 && process.exitCode !== 1 ? 0 : 1);
}

main().catch((error) => {
  console.error("Could not run the checks. Is the server running? ", error.message);
  process.exit(1);
});