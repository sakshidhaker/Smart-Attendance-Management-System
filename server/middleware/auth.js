const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Verifies the token and sets req.user
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) throw new ApiError(401, "Token missing");

  // jwt.verify throws on a wrong or expired token, and the errorHandler turns it into a 401
  const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "User not found");

  req.user = user;
  next();
});

// Role check: authorize("admin", "faculty")
exports.authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new ApiError(403, "Access denied"));
    next();
  };
