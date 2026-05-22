const mongoose = require("mongoose");

const membershipPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    durationInDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    sessionCount: {
      type: Number,
      default: null,
      min: [0, "Session count cannot be negative"],
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "membershippackages",
  },
);

membershipPackageSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model("MembershipPackage", membershipPackageSchema);
