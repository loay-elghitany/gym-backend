const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["checked_in", "checked_out"],
      default: "checked_in",
    },
    checkInAt: {
      type: Date,
      default: () => new Date(),
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    checkOutAt: {
      type: Date,
    },
    locationType: {
      type: String,
      enum: ["gym", "class", "training"],
      default: "gym",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CheckIn", checkInSchema);
