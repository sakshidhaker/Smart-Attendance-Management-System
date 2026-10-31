const ApiError = require("../utils/ApiError");

// Koi route match na ho to 404
exports.notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

const DUPLICATE_MESSAGES = {
  email: "Email already registered",
  code: "Subject code already exists",
};

// Poore backend ka ek hi error handler (central error handling)
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Server error";
  let errors = err.errors;

  if (err.name === "ValidationError" && err.errors) {
    // Mongoose schema validation
    status = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = errors[0];
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    // duplicate key (unique index)
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = DUPLICATE_MESSAGES[field] || "Duplicate entry";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  }

  if (status >= 500) {
    console.error(err);
    message = process.env.NODE_ENV === "production" ? "Server error" : message;
  }

  res.status(status).json({ message, ...(errors ? { errors } : {}) });
};
