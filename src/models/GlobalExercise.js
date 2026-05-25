const mongoose = require("mongoose");

const globalExerciseSchema = new mongoose.Schema(
  {
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    nameAr: {
      type: String,
      required: true,
      trim: true,
    },
    targetMuscle: {
      type: String,
      required: true,
      trim: true,
    },
    gifUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "globalexercises",
  },
);

globalExerciseSchema.index({ nameEn: 1 });
globalExerciseSchema.index({ nameAr: 1 });

module.exports = mongoose.model("GlobalExercise", globalExerciseSchema);
