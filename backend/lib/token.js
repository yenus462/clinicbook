require("dotenv").config();
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

// Stop at startup if the secret is missing or weak
if (!secret || secret.length < 32) {
  throw new Error(
    "JWT_SECRET is missing or too short in backend/.env (use at least 32 characters)."
  );
}

// Creates a signed token that stores the user id (as "sub")
function signToken(user) {
  return jwt.sign({ role: user.role }, secret, {
    subject: String(user.id),
    expiresIn,
    algorithm: "HS256",
  });
}

// Checks the signature and expiry. Throws if the token is not valid.
function verifyToken(token) {
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
}

module.exports = { signToken, verifyToken };