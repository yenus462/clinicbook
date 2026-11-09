// Runs every check script in order and stops at the first failure.
// The backend must be running (npm run dev). Usage: npm run check:all
// The security check runs last, because it uses up the login rate limit.

const { spawnSync } = require("child_process");
const path = require("path");

const scripts = [
  "testAuth.js",
  "testProfile.js",
  "testAdmin.js",
  "testBooking.js",
  "testAppointments.js",
  "testSecurity.js",
];

const results = [];

for (const script of scripts) {
  console.log("\n==================== " + script + " ====================");
  const run = spawnSync(process.execPath, [path.join(__dirname, script)], {
    stdio: "inherit",
  });
  const ok = run.status === 0;
  results.push({ script, ok });
  if (!ok) break;
}

console.log("\n==================== SUMMARY ====================");
for (const r of results) {
  console.log((r.ok ? "PASS  " : "FAIL  ") + r.script);
}
const notRun = scripts.length - results.length;
if (notRun > 0) console.log("SKIPPED  " + notRun + " script(s) after the first failure");

const allOk = results.length === scripts.length && results.every((r) => r.ok);
console.log(allOk ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(allOk ? 0 : 1);