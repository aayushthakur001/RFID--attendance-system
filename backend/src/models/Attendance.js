const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    }
  },
  { timestamps: true }
);

// attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, date: 1 });


module.exports = mongoose.model("Attendance", attendanceSchema, "attendance");