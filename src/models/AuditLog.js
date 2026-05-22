const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Audit action is required"],
      trim: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorName: {
      type: String,
      trim: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      trim: true,
    },
    targetType: {
      type: String,
      trim: true,
    },
    details: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "auditlogs",
  },
);

auditLogSchema.index({ createdAt: -1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);
