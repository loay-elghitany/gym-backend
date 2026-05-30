const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number },
    reps: { type: String },
    notes: { type: String },
    rest: { type: String },
    instruction: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    gifUrl: { type: String, default: "" },
  },
  { _id: false },
);

const workoutDaySchema = new mongoose.Schema(
  {
    dayName: { type: String, required: true, trim: true },
    exercises: { type: [exerciseSchema], default: [] },
  },
  { _id: false },
);

const dietNoteSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    alternatives: { type: [String], default: [] },
  },
  { _id: false },
);

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 0, default: 0 },
    calories: { type: Number, default: null },
    protein: { type: Number, default: null },
    carbs: { type: Number, default: null },
    fats: { type: Number, default: null },
    baseUnit: { type: String, trim: true, default: "100g" },
  },
  { _id: false },
);

const mealSchema = new mongoose.Schema(
  {
    mealName: { type: String, required: true, trim: true },
    foods: { type: [foodItemSchema], default: [] },
  },
  { _id: false },
);

const planSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    exercises: { type: [exerciseSchema], default: [] },
    days: { type: [workoutDaySchema], default: [] },
    dietNotes: { type: [dietNoteSchema], default: [] },
    meals: { type: [mealSchema], default: [] },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    tenantSlug: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

planSchema.index({ tenantId: 1, assignedTo: 1 });

module.exports = mongoose.model("Plan", planSchema);
