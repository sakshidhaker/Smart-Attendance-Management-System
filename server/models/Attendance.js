const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: Date, required: true },
    period: { type: Number, required: true, min: 1, max: 8 },
    records: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["present", "absent"], required: true },
      },
    ],
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Optimization 1: the same subject + date + period cannot be marked twice (unique), and lookups by these fields are fast
attendanceSchema.index({ subject: 1, date: 1, period: 1 }, { unique: true });
// Optimization 2: makes the per-student attendance aggregation fast
attendanceSchema.index({ "records.student": 1 });
// Optimization 3: for the date-wise trend on the dashboard
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
