const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const formatUser = require("../utils/formatUser");

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register  (public register se hamesha student hi banta hai)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, rollNo, semester } = req.body;

  const user = await User.create({ name, email, password, role: "student", rollNo, semester });
  res.status(201).json({ token: makeToken(user._id), user: formatUser(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, "Invalid email or password");

  res.json({ token: makeToken(user._id), user: formatUser(user) });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json(formatUser(req.user));
});

// PUT /api/auth/me  (profile: naam badalna, password badalna)
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (name) user.name = name;

  if (newPassword) {
    if (!currentPassword) throw new ApiError(400, "currentPassword is required to change password");
    if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, "Current password is incorrect");
    user.password = newPassword;
  }

  await user.save();
  res.json(formatUser(user));
});
