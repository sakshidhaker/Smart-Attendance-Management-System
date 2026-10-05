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

// ek subject + date + period ki attendance dobara mark nahi hogi
attendanceSchema.index({ subject: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);