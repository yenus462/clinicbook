const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { verifyToken } = require("../lib/token");
const { publicUserSelect } = require("../lib/userFields");

// Protects a route. The browser must send:  Authorization: Bearer <token>
// On success, req.user holds the logged-in user (without the password hash).
async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Please log in first.", 401);
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    throw new AppError("Your session is invalid or expired. Please log in again.", 401);
  }

  // Load the user from the database, so deleted users and role changes count immediately
  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError("Your session is invalid. Please log in again.", 401);
  }

  req.user = user;
  next();
}

module.exports = authenticate;