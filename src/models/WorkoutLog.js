const mongoose = require("mongoose");

const workoutLogSchema = new mongoose.Schema(
  {
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    exercises: [
      {
        name: String,
        sets: Number,
        reps: Number,
        weight: Number,
        notes: String,
        totalVolume: Number, // sets * reps * weight
      },
    ],
    totalVolume: {
      type: Number,
      default: 0,
    },
    sessionDate: {
      type: Date,
      default: Date.now,
    },
    meta: {
      type: Object,
    },
  },
  { timestamps: true, collection: "workoutlogs" },
);

// Pre-save hook to calculate totalVolume
workoutLogSchema.pre("save", async function () {
  let sum = 0;

  if (Array.isArray(this.exercises)) {
    this.exercises = this.exercises.map((ex) => {
      const sets = Number(ex.sets) || 0;
      const reps = Number(ex.reps) || 0;
      const weight = Number(ex.weight) || 0;
      const vol = sets * reps * weight;
      sum += vol;
      return { ...ex, totalVolume: vol };
    });
  }

  this.totalVolume = sum;
});

module.exports = require("mongoose").model("WorkoutLog", workoutLogSchema);
