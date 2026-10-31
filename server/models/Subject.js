const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Subject name is required"], trim: true },
    code: { type: String, required: [true, "Subject code is required"], unique: true, uppercase: true, trim: true },
    semester: { type: Number, required: [true, "Semester is required"], min: 1, max: 8 },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// "faculty ke subjects" aur "student ke subjects" queries ke liye
subjectSchema.index({ faculty: 1 });
subjectSchema.index({ students: 1 });

module.exports = mongoose.model("Subject", subjectSchema);
