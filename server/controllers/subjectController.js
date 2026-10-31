const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// faculty asli faculty user ho aur students asli student users hon
const checkPeople = async (facultyId, studentIds) => {
  if (facultyId) {
    const f = await User.findById(facultyId).select("role");
    if (!f || f.role !== "faculty") throw new ApiError(400, "faculty must be a valid faculty user");
  }
  if (studentIds) {
    const unique = [...new Set(studentIds.map(String))];
    if (!unique.every((id) => mongoose.isValidObjectId(id))) throw new ApiError(400, "students must be valid ids");
    const count = await User.countDocuments({ _id: { $in: unique }, role: "student" });
    if (count !== unique.length) throw new ApiError(400, "students must be valid student users");
    return unique;
  }
  return undefined;
};

// GET /api/subjects  (role ke hisaab se apne subjects)
exports.listSubjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "faculty") filter.faculty = req.user._id;
  if (req.user.role === "student") filter.students = req.user._id;

  let query = Subject.find(filter).populate("faculty", "name email").sort("code");
  query = req.user.role === "student" ? query.select("-students") : query.populate("students", "name rollNo semester");
  res.json(await query);
});

// GET /api/subjects/:id
exports.getSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id).populate("faculty", "name email");
  if (!subject) throw new ApiError(404, "Subject not found");

  const user = req.user;
  if (user.role === "faculty" && String(subject.faculty._id) !== String(user._id)) {
    throw new ApiError(403, "Not your subject");
  }
  if (user.role === "student" && !subject.students.map(String).includes(String(user._id))) {
    throw new ApiError(403, "You are not enrolled in this subject");
  }

  if (user.role === "student") {
    const obj = subject.toObject();
    delete obj.students;
    return res.json(obj);
  }

  await subject.populate("students", "name rollNo semester");
  res.json(subject);
});

// POST /api/subjects  (admin)
exports.createSubject = asyncHandler(async (req, res) => {
  const { name, code, semester, faculty, students } = req.body;
  const studentIds = await checkPeople(faculty, students || []);

  const subject = await Subject.create({ name, code, semester, faculty, students: studentIds || [] });
  res.status(201).json(subject);
});

// PUT /api/subjects/:id  (admin)
exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError(404, "Subject not found");

  const { name, code, semester, faculty, students } = req.body;
  const studentIds = await checkPeople(faculty, students);

  if (name !== undefined) subject.name = name;
  if (code !== undefined) subject.code = code;
  if (semester !== undefined) subject.semester = semester;
  if (faculty !== undefined) subject.faculty = faculty;
  if (studentIds) subject.students = studentIds;

  await subject.save();
  res.json(subject);
});

// DELETE /api/subjects/:id  (admin) -> us subject ki attendance bhi delete
exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError(404, "Subject not found");

  await Attendance.deleteMany({ subject: subject._id });
  await subject.deleteOne();
  res.json({ message: "Subject deleted" });
});
