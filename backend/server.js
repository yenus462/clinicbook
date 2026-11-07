require("dotenv").config();
const app = require("./app");
const prisma = require("./lib/prisma");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});

// Close the database connection cleanly when the server is stopped
async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);