const AuditLog = require("../models/AuditLog");

exports.logAuditEvent = async ({
  action,
  actorId,
  actorName,
  targetId,
  targetType,
  details = {},
}) => {
  try {
    await AuditLog.create({
      action,
      actorId,
      actorName,
      targetId,
      targetType,
      details,
    });
  } catch (error) {
    console.error("Audit log creation failed:", error.message);
  }
};
