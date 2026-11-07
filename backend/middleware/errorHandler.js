const AppError = require("../lib/AppError");

// Runs when no route matched the request
function notFound(req, res, next) {
  next(new AppError("Route not found: " + req.method + " " + req.originalUrl, 404));
}

// Runs for every error. Always answers with the same JSON shape:
// { "error": { "message": "..." } }
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message;

  // Broken JSON sent by a client
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body.";
  }

  // Known database errors from Prisma
  if (err.code === "P2002") {
    status = 409;
    message = "That value already exists.";
  } else if (err.code === "P2025") {
    status = 404;
    message = "Record not found.";
  }

  // Unexpected errors: log the details for us, hide them from the client
  if (status >= 500) {
    console.error(err);
    message = "Something went wrong on the server.";
  }

  res.status(status).json({ error: { message } });
}

module.exports = { notFound, errorHandler };