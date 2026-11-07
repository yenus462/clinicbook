// An error we create on purpose, with an HTTP status code.
// Example: throw new AppError("Doctor not found.", 404);

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;