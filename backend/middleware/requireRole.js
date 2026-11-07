const AppError = require("../lib/AppError");

// Use after authenticate. Example: requireRole("ADMIN")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Please log in first.", 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to do this.", 403));
    }
    next();
  };
}

module.exports = requireRole;