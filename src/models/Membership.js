const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Membership plan name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "TenantId is required"],
      index: true,
    },
    tenantSlug: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR", "AED"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1"],
    },
    durationUnit: {
      type: String,
      enum: ["days", "weeks", "months", "years"],
      default: "months",
    },
    // Features included
    features: [
      {
        type: String,
      },
    ],
    maxClassesPerWeek: {
      type: Number,
      default: null, // null means unlimited
    },
    accessToEquipment: {
      type: Boolean,
      default: true,
    },
    accessToPersonalTrainer: {
      type: Boolean,
      default: false,
    },
    // Billing cycles
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "annual"],
      default: "monthly",
    },
    renewalReminder: {
      type: Number,
      default: 7, // days before expiry
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    collection: "memberships",
  },
);

// Compound index for tenant-specific memberships
membershipSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model("Membership", membershipSchema);
