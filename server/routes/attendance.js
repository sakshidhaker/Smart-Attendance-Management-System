const express = require("express");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const { calcStats } = require("../utils/stats");

const router = express.Router();
const isId = (id) => mongoose.isValidObjectId(id);

// faculty sirf apne subject ko manage kar sakti hai, admin sabko
const canManage = (user, subject) =>
  user.role === "admin" || String(subject.faculty) === String(user._id);

// records me sirf us subject ke enrolled students hone chahiye
const recordsValid = (subject, records) => {
  const enrolled = new Set(subject.students.map(String));
  return records.every(
    (r) => enrolled.has(String(r.student)) && ["present", "absent"].includes(r.status)
  );
};

// POST /api/attendance  -> attendance mark karo
router.post("/", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    const { subject, date, period, records } = req.body;
    if (!isId(subject) || !date || !period || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "subject, date, period, records required" });
    }
    if (isNaN(new Date(date))) return res.status(400).json({ message: "Invalid date" });

    const sub = await Subject.findById(subject);
    if (!sub) return res.status(404).json({ message: "Subject not found" });
    if (!canManage(req.user, sub)) return res.status(403).json({ message: "Not your subject" });
    if (!recordsValid(sub, records)) {
      return res.status(400).json({ message: "Invalid student or status in records" });
    }

    const att = await Attendance.create({
      subject, date: new Date(date), period, records, markedBy: req.user._id,
    });
    res.status(201).json(att);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Attendance already marked for this subject, date and period" });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance?subject=ID&date=YYYY-MM-DD
router.get("/", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) {
      if (!isId(req.query.subject)) return res.status(400).json({ message: "Invalid subject id" });
      filter.subject = req.query.subject;
    }
    if (req.query.date) filter.date = new Date(req.query.date);

    if (req.user.role === "faculty") {
      const mine = await Subject.find({ faculty: req.user._id }).select("_id");
      const ids = mine.map((s) => String(s._id));
      if (filter.subject && !ids.includes(String(filter.subject))) {
        return res.status(403).json({ message: "Not your subject" });
      }
      if (!filter.subject) filter.subject = { $in: ids };
    }

    const list = await Attendance.find(filter)
      .populate("subject", "name code")
      .populate("records.student", "name rollNo")
      .sort({ date: -1, period: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/at-risk?subject=ID  -> 75% se kam wale students
router.get("/at-risk", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    const { subject } = req.query;
    if (!isId(subject)) return res.status(400).json({ message: "Valid subject id required" });
    const sub = await Subject.findById(subject);
    if (!sub) return res.status(404).json({ message: "Subject not found" });
    if (!canManage(req.user, sub)) return res.status(403).json({ message: "Not your subject" });

    const rows = await Attendance.aggregate([
      { $match: { subject: new mongoose.Types.ObjectId(subject) } },
      { $unwind: "$records" },
      {
        $group: {
          _id: "$records.student",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
        },
      },
    ]);

    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select("name rollNo");
    const nameMap = new Map(users.map((u) => [String(u._id), u]));

    const result = rows
      .map((r) => {
        const u = nameMap.get(String(r._id));
        return {
          student: { id: r._id, name: u ? u.name : "Unknown", rollNo: u ? u.rollNo : "" },
          ...calcStats(r.present, r.total),
        };
      })
      .filter((r) => r.percentage < 75)
      .sort((a, b) => a.percentage - b.percentage);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/student/:id -> subject-wise % + bunk planner + risk
router.get("/student/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Invalid id" });
    if (req.user.role === "student" && String(req.user._id) !== id) {
      return res.status(403).json({ message: "You can only view your own attendance" });
    }

    const oid = new mongoose.Types.ObjectId(id);
    const rows = await Attendance.aggregate([
      { $match: { "records.student": oid } },
      { $unwind: "$records" },
      { $match: { "records.student": oid } },
      {
        $group: {
          _id: "$subject",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
        },
      },
      { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "sub" } },
      { $unwind: "$sub" },
    ]);

    const subjects = rows
      .map((r) => ({
        subjectId: r._id,
        name: r.sub.name,
        code: r.sub.code,
        ...calcStats(r.present, r.total),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    const totalPresent = subjects.reduce((s, x) => s + x.present, 0);
    const totalClasses = subjects.reduce((s, x) => s + x.total, 0);

    res.json({ overall: calcStats(totalPresent, totalClasses), subjects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/attendance/:id -> records edit karo
router.put("/:id", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const att = await Attendance.findById(req.params.id);
    if (!att) return res.status(404).json({ message: "Attendance not found" });

    const sub = await Subject.findById(att.subject);
    if (!sub || !canManage(req.user, sub)) {
      return res.status(403).json({ message: "Not your subject" });
    }

    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0 || !recordsValid(sub, records)) {
      return res.status(400).json({ message: "Valid records required" });
    }
    att.records = records;
    await att.save();
    res.json(att);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/attendance/:id
router.delete("/:id", protect, authorize("faculty", "admin"), async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const att = await Attendance.findById(req.params.id);
    if (!att) return res.status(404).json({ message: "Attendance not found" });

    const sub = await Subject.findById(att.subject);
    if (!sub || !canManage(req.user, sub)) {
      return res.status(403).json({ message: "Not your subject" });
    }
    await att.deleteOne();
    res.json({ message: "Attendance deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;