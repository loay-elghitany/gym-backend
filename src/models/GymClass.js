const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "absent",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const gymClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Class title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    startTime: {
      type: Date,
      required: [true, "Class start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "Class end time is required"],
    },
    capacity: {
      type: Number,
      default: 20,
      min: [1, "Class capacity must be at least 1"],
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    enrolledMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attendanceRecord: [attendanceRecordSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("GymClass", gymClassSchema);
