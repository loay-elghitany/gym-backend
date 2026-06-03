const mongoose = require("mongoose");

const weeklyCheckInSchema = new mongoose.Schema(
  {
    traineeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Trainer is optional: allow trainees without an active trainer to submit
      required: false,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    tenantSlug: {
      type: String,
      required: true,
      index: true,
    },
    currentWeight: {
      type: Number,
      min: 0,
    },
    fatigueLevel: {
      type: Number,
      min: 1,
      max: 10,
      required: [true, "Fatigue level is required (1-10)"],
    },
    notes: {
      type: String,
      trim: true,
    },
    photos: [
      {
        url: { type: String, required: true },
        viewType: {
          type: String,
          enum: ["front", "back", "side", "other"],
          default: "front",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    weekNumber: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    trainerFeedback: {
      type: String,
      trim: true,
    },
    trainerReviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "weeklycheckins",
  },
);

// Index for faster queries
weeklyCheckInSchema.index({ traineeId: 1, weekNumber: 1, year: 1 });
weeklyCheckInSchema.index({ trainerId: 1, createdAt: -1 });

// Pre-save hook to calculate week number if not provided
weeklyCheckInSchema.pre("save", function (next) {
  if (!this.weekNumber || !this.year) {
    const date = this.createdAt || new Date();
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    this.weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7,
    );
    this.year = date.getFullYear();
  }
  next();
});

module.exports = mongoose.model("WeeklyCheckIn", weeklyCheckInSchema);
