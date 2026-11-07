// Adds a random JWT_SECRET and JWT_EXPIRES_IN to .env (only if missing).
const fs = require("fs");
const crypto = require("crypto");

const envPath = ".env";
const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

if (current.includes("JWT_SECRET=")) {
  console.log("JWT_SECRET already exists in .env. Nothing changed.");
} else {
  const secret = crypto.randomBytes(48).toString("hex");
  const addition =
    (current.endsWith("\n") || current === "" ? "" : "\n") +
    'JWT_SECRET="' + secret + '"\n' +
    'JWT_EXPIRES_IN="7d"\n';
  fs.appendFileSync(envPath, addition);
  console.log("JWT_SECRET and JWT_EXPIRES_IN were added to .env.");
}