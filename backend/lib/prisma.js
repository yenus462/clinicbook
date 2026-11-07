// One shared Prisma client for the whole backend.
// Every route file will import this instead of creating its own connection.

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;