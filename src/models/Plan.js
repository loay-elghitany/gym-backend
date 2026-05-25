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

const dietNoteSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    alternatives: { type: [String], default: [] },
  },
  { _id: false },
);

const planSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    exercises: { type: [exerciseSchema], default: [] },
    dietNotes: { type: [dietNoteSchema], default: [] },
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
