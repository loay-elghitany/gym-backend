const mongoose = require("mongoose");

const saasPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [100, "Plan name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Plan slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be below 0"],
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual", "lifetime"],
      default: "monthly",
    },
    maxMembers: {
      type: Number,
      default: 100,
      min: [1, "Max members must be at least 1"],
    },
    maxTrainers: {
      type: Number,
      default: 10,
      min: [1, "Max trainers must be at least 1"],
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "saasplans",
  },
);

module.exports = mongoose.model("SaaSPlan", saasPlanSchema);
