const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(protect, authorize("admin"));

const clean = (u) => {
  const obj = u.toObject();
  delete obj.password;
  return obj;
};

// GET /api/users?role=student&semester=5
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.semester) filter.semester = Number(req.query.semester);
    res.json(await User.find(filter).sort("name"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, rollNo, semester } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const user = await User.create({ name, email, password, role, rollNo, semester });
    res.status(201).json(clean(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    ["name", "email", "password", "role", "rollNo", "semester"].forEach((f) => {
      if (req.body[f] !== undefined && req.body[f] !== "") user[f] = req.body[f];
    });
    await user.save();
    res.json(clean(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;