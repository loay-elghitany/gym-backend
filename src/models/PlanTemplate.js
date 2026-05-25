const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    sets: { type: Number, min: 0, default: 0 },
    reps: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    gifUrl: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const mealSchema = new mongoose.Schema(
  {
    mealName: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const planTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    exercises: {
      type: [exerciseSchema],
      default: [],
    },
    meals: {
      type: [mealSchema],
      default: [],
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
    createdByTrainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "plantemplates",
  },
);

planTemplateSchema.index({ tenantId: 1, createdByTrainerId: 1, isActive: 1 });

module.exports = mongoose.model("PlanTemplate", planTemplateSchema);
