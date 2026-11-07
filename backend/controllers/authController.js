const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { signToken } = require("../lib/token");
const { publicUserSelect, toPublicUser } = require("../lib/userFields");
const { validateRegister, validateLogin } = require("../lib/validators");

const SALT_ROUNDS = 10;

// Compared against when the email is unknown, so the response time
// does not reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", SALT_ROUNDS);

// POST /api/auth/register
async function register(req, res) {
  const { errors, values } = validateRegister(req.body || {});
  if (errors.length > 0) {
    throw new AppError(errors.join(" "), 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: values.email } });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(values.password, SALT_ROUNDS);

  // The role is always PATIENT. Anything the client sends as "role" is ignored.
  const user = await prisma.user.create({
    data: {
      name: values.name,
      email: values.email,
      phone: values.phone,
      passwordHash,
      role: "PATIENT",
    },
    select: publicUserSelect,
  });

  res.status(201).json({ user, token: signToken(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { errors, values } = validateLogin(req.body || {});
  if (errors.length > 0) {
    throw new AppError(errors.join(" "), 400);
  }

  const user = await prisma.user.findUnique({ where: { email: values.email } });

  // Always run bcrypt, even for unknown emails
  const passwordOk = await bcrypt.compare(
    values.password,
    user ? user.passwordHash : DUMMY_HASH
  );

  if (!user || !passwordOk) {
    throw new AppError("Invalid email or password.", 401);
  }

  res.json({ user: toPublicUser(user), token: signToken(user) });
}

// GET /api/auth/me  (after authenticate)
async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };