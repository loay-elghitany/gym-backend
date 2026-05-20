const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a gym name"],
      trim: true,
      maxlength: [100, "Gym name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    email: {
      type: String,
      required: [true, "Contact email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "trial"],
      default: "trial",
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "professional", "enterprise"],
      default: "basic",
    },
    maxMembers: {
      type: Number,
      default: 100,
      min: 1,
    },
    maxTrainers: {
      type: Number,
      default: 10,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    collection: "tenants",
  },
);

// Index for faster queries
tenantSchema.index({ email: 1 });
tenantSchema.index({ subscriptionStatus: 1 });

module.exports = mongoose.model("Tenant", tenantSchema);
