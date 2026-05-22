const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Broadcast title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Broadcast message is required"],
      trim: true,
    },
    audience: {
      type: String,
      enum: ["all", "owners", "members"],
      default: "all",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "broadcasts",
  },
);

broadcastSchema.index({ isActive: 1, createdAt: -1 });
module.exports = mongoose.model("Broadcast", broadcastSchema);
