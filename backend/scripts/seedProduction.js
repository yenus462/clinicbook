// Seeds the PRODUCTION database. It asks for the two values, so nothing is saved in a file.
// Usage:  node scripts/seedProduction.js

const readline = require("readline");
const { spawnSync } = require("child_process");
const path = require("path");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

async function main() {
  console.log("This will fill your ONLINE (Neon) database.\n");

  const databaseUrl = (await ask("Paste your Neon connection string and press Enter:\n> ")).trim();
  const adminPassword = (await ask("\nChoose a NEW admin password (8+ characters) and press Enter:\n> ")).trim();
  rl.close();

  if (!databaseUrl.startsWith("postgresql://")) {
    console.log("\nThat does not look like a Neon string. It must start with postgresql://");
    process.exit(1);
  }
  if (databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) {
    console.log("\nThat is your LOCAL database, not Neon. Stopping so nothing is changed.");
    process.exit(1);
  }
  if (adminPassword.length < 8) {
    console.log("\nThe admin password must be at least 8 characters.");
    process.exit(1);
  }

  const run = spawnSync(process.execPath, [path.join(__dirname, "..", "prisma", "seed.js")], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl, ADMIN_PASSWORD: adminPassword },
  });
  process.exit(run.status === 0 ? 0 : 1);
}

main();