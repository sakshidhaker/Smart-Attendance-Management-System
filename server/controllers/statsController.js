const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { calcStats } = require("../utils/stats");

const DAY = 24 * 60 * 60 * 1000;
const presentSum = { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } };

// GET /api/stats/overview  (admin + faculty dashboard)
// Yahan MongoDB aggregation pipelines se summary metrics nikalte hain (Database Optimization)
exports.overview = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const subjects = await Subject.find(isAdmin ? {} : { faculty: req.user._id }).select("name code students");
  const match = { subject: { $in: subjects.map((s) => s._id) } };
  const since = new Date(Date.now() - 30 * DAY);
  since.setUTCHours(0, 0, 0, 0);

  const [sheets, perSubject, perStudent, trend, usersByRole] = await Promise.all([
    Attendance.countDocuments(match),
    // subject-wise present/total
    Attendance.aggregate([
      { $match: match },
      { $unwind: "$records" },
      { $group: { _id: "$subject", total: { $sum: 1 }, present: presentSum } },
    ]),
    // student-wise present/total (at-risk count ke liye)
    Attendance.aggregate([
      { $match: match },
      { $unwind: "$records" },
      { $group: { _id: "$records.student", total: { $sum: 1 }, present: presentSum } },
    ]),
    // pichhle 30 din ka date-wise trend
    Attendance.aggregate([
      { $match: { ...match, date: { $gte: since } } },
      { $unwind: "$records" },
      { $group: { _id: "$date", total: { $sum: 1 }, present: presentSum } },
      { $sort: { _id: 1 } },
    ]),
    isAdmin ? User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]) : Promise.resolve(null),
  ]);

  const subjectMap = new Map(perSubject.map((r) => [String(r._id), r]));
  const totalPresent = perSubject.reduce((s, r) => s + r.present, 0);
  const totalRecords = perSubject.reduce((s, r) => s + r.total, 0);
  const enrolled = new Set(subjects.flatMap((s) => s.students.map(String)));

  res.json({
    totals: {
      subjects: subjects.length,
      students: enrolled.size,
      sheets,
      atRiskStudents: perStudent.filter((r) => calcStats(r.present, r.total).percentage < 75).length,
    },
    overall: calcStats(totalPresent, totalRecords),
    subjects: subjects.map((s) => {
      const r = subjectMap.get(String(s._id)) || { present: 0, total: 0 };
      return { id: s._id, name: s.name, code: s.code, ...calcStats(r.present, r.total) };
    }),
    trend: trend.map((r) => ({ date: r._id.toISOString().slice(0, 10), percentage: calcStats(r.present, r.total).percentage })),
    usersByRole: usersByRole ? Object.fromEntries(usersByRole.map((r) => [r._id, r.count])) : undefined,
  });
});
