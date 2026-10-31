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

// Optimization 1: same subject + date + period dobara mark na ho (unique) aur is query ko fast kare
attendanceSchema.index({ subject: 1, date: 1, period: 1 }, { unique: true });
// Optimization 2: student ki attendance nikalne wali aggregation fast ho
attendanceSchema.index({ "records.student": 1 });
// Optimization 3: dashboard ke date-wise trend ke liye
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
