const User = require("../models/User");
const Subject = require("../models/Subject");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");

const clean = (u) => {
  const obj = u.toObject();
  delete obj.password;
  return obj;
};

// GET /api/users?role=student&semester=5&q=sharma
exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = String(req.query.role);
  if (req.query.semester) filter.semester = Number(req.query.semester);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { rollNo: rx }];
  }
  res.json(await User.find(filter).sort("name").limit(500));
});

// GET /api/users/:id
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  res.json(user);
});

// POST /api/users
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNo, semester } = req.body;
  const user = await User.create({ name, email, password, role, rollNo, semester });
  res.status(201).json(clean(user));
});

// PUT /api/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  ["name", "email", "password", "role", "rollNo", "semester"].forEach((f) => {
    if (req.body[f] !== undefined && req.body[f] !== "") user[f] = req.body[f];
  });

  await user.save();
  res.json(clean(user));
});

// DELETE /api/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "faculty") {
    const count = await Subject.countDocuments({ faculty: user._id });
    if (count > 0) throw new ApiError(400, "This faculty still has subjects. Reassign or delete them first");
  }

  // also remove the student from every subject's enrolled list
  await Subject.updateMany({ students: user._id }, { $pull: { students: user._id } });
  await user.deleteOne();
  res.json({ message: "User deleted" });
});
