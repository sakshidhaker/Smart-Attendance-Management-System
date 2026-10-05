const express = require("express");
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// GET /api/subjects  (role ke hisaab se apne subjects)
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "faculty") filter.faculty = req.user._id;
    if (req.user.role === "student") filter.students = req.user._id;

    let query = Subject.find(filter).populate("faculty", "name email").sort("code");
    if (req.user.role === "student") {
      query = query.select("-students"); // student ko dusron ki list nahi dikhegi
    } else {
      query = query.populate("students", "name rollNo");
    }
    res.json(await query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/subjects  (admin)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, code, semester, faculty, students } = req.body;
    if (!name || !code || !semester || !faculty) {
      return res.status(400).json({ message: "name, code, semester, faculty required" });
    }
    const subject = await Subject.create({ name, code, semester, faculty, students: students || [] });
    res.status(201).json(subject);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Subject code already exists" });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/subjects/:id  (admin)
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/subjects/:id  (admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;