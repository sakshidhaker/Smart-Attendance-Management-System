const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { calcStats } = require("../utils/stats");

const DAY = 24 * 60 * 60 * 1000;

// faculty sirf apne subject ko manage kar sakti hai, admin sabko
const canManage = (user, subject) => user.role === "admin" || String(subject.faculty) === String(user._id);

// date ko UTC midnight bana do, taaki unique index (subject + date + period) sahi chale
const normalizeDate = (value) => {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// records me sirf us subject ke enrolled students, sahi status, aur koi duplicate student nahi
const recordsValid = (subject, records) => {
  const enrolled = new Set(subject.students.map(String));
  const seen = new Set();
  return records.every((r) => {
    if (!r || !enrolled.has(String(r.student)) || !["present", "absent"].includes(r.status)) return false;
    if (seen.has(String(r.student))) return false;
    seen.add(String(r.student));
    return true;
  });
};

const loadManagedSubject = async (subjectId, user) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, "Subject not found");
  if (!canManage(user, subject)) throw new ApiError(403, "Not your subject");
  return subject;
};

// Ek subject ke har student ka present/total (aggregation pipeline)
const buildSubjectSummary = async (subject) => {
  const rows = await Attendance.aggregate([
    { $match: { subject: subject._id } },
    { $unwind: "$records" },
    {
      $group: {
        _id: "$records.student",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
      },
    },
  ]);
  const byStudent = new Map(rows.map((r) => [String(r._id), r]));

  const totalClasses = await Attendance.countDocuments({ subject: subject._id });
  const students = await User.find({ _id: { $in: subject.students } }).select("name rollNo").sort("rollNo");

  return {
    totalClasses,
    students: students.map((st) => {
      const r = byStudent.get(String(st._id)) || { present: 0, total: 0 };
      return { student: { id: st._id, name: st.name, rollNo: st.rollNo }, ...calcStats(r.present, r.total) };
    }),
  };
};

// POST /api/attendance
exports.markAttendance = asyncHandler(async (req, res) => {
  const { subject: subjectId, date, period, records } = req.body;

  const subject = await loadManagedSubject(subjectId, req.user);

  const day = normalizeDate(date);
  if (day.getTime() > Date.now() + DAY) throw new ApiError(400, "Date cannot be in the future");
  if (!recordsValid(subject, records)) throw new ApiError(400, "Invalid student or status in records");

  try {
    const att = await Attendance.create({ subject: subjectId, date: day, period, records, markedBy: req.user._id });
    res.status(201).json(att);
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "Attendance already marked for this subject, date and period");
    }
    throw err;
  }
});

// GET /api/attendance?subject=ID&date=YYYY-MM-DD
exports.listAttendance = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.subject) {
    if (!mongoose.isValidObjectId(req.query.subject)) throw new ApiError(400, "Invalid subject id");
    filter.subject = req.query.subject;
  }
  if (req.query.date) {
    if (Number.isNaN(new Date(req.query.date).getTime())) throw new ApiError(400, "Invalid date");
    filter.date = normalizeDate(req.query.date);
  }

  if (req.user.role === "faculty") {
    const mine = await Subject.find({ faculty: req.user._id }).select("_id");
    const ids = mine.map((s) => String(s._id));
    if (filter.subject && !ids.includes(String(filter.subject))) throw new ApiError(403, "Not your subject");
    if (!filter.subject) filter.subject = { $in: ids };
  }

  const list = await Attendance.find(filter)
    .populate("subject", "name code")
    .populate("records.student", "name rollNo")
    .sort({ date: -1, period: 1 })
    .limit(200);
  res.json(list);
});

// GET /api/attendance/:id
exports.getAttendance = asyncHandler(async (req, res) => {
  const att = await Attendance.findById(req.params.id)
    .populate("subject", "name code faculty")
    .populate("records.student", "name rollNo");
  if (!att) throw new ApiError(404, "Attendance not found");

  if (req.user.role === "faculty" && String(att.subject.faculty) !== String(req.user._id)) {
    throw new ApiError(403, "Not your subject");
  }
  res.json(att);
});

// GET /api/attendance/subject/:subjectId/summary -> subject ke saare students ka %
exports.subjectSummary = asyncHandler(async (req, res) => {
  const subject = await loadManagedSubject(req.params.subjectId, req.user);
  const summary = await buildSubjectSummary(subject);
  res.json({ subject: { id: subject._id, name: subject.name, code: subject.code, semester: subject.semester }, ...summary });
});

// GET /api/attendance/at-risk?subject=ID -> 75% se kam wale students
exports.atRisk = asyncHandler(async (req, res) => {
  const { subject: subjectId } = req.query;
  if (!mongoose.isValidObjectId(subjectId)) throw new ApiError(400, "Valid subject id required");

  const subject = await loadManagedSubject(subjectId, req.user);
  const { students } = await buildSubjectSummary(subject);

  res.json(students.filter((s) => s.total > 0 && s.percentage < 75).sort((a, b) => a.percentage - b.percentage));
});

// GET /api/attendance/student/:id -> subject-wise % + bunk planner + risk
exports.studentStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.role === "student" && String(req.user._id) !== id) {
    throw new ApiError(403, "You can only view your own attendance");
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
    .map((r) => ({ subjectId: r._id, name: r.sub.name, code: r.sub.code, ...calcStats(r.present, r.total) }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const totalPresent = subjects.reduce((s, x) => s + x.present, 0);
  const totalClasses = subjects.reduce((s, x) => s + x.total, 0);

  res.json({ overall: calcStats(totalPresent, totalClasses), subjects });
});

// PUT /api/attendance/:id -> records edit
exports.updateAttendance = asyncHandler(async (req, res) => {
  const att = await Attendance.findById(req.params.id);
  if (!att) throw new ApiError(404, "Attendance not found");

  const subject = await Subject.findById(att.subject);
  if (!subject || !canManage(req.user, subject)) throw new ApiError(403, "Not your subject");

  const { records } = req.body;
  if (!recordsValid(subject, records)) throw new ApiError(400, "Invalid student or status in records");

  att.records = records;
  await att.save();
  res.json(att);
});

// DELETE /api/attendance/:id
exports.deleteAttendance = asyncHandler(async (req, res) => {
  const att = await Attendance.findById(req.params.id);
  if (!att) throw new ApiError(404, "Attendance not found");

  const subject = await Subject.findById(att.subject);
  if (!subject || !canManage(req.user, subject)) throw new ApiError(403, "Not your subject");

  await att.deleteOne();
  res.json({ message: "Attendance deleted" });
});
