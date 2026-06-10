import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  ipAddress: { type: String },
  actionType: { type: String, required: true, index: true }, // e.g. otp_generated, otp_verify_failed, password_reset_success
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);

/**
 * Helper to log security actions to the database.
 */
export async function writeAuditLog(userId, ipAddress, actionType, details) {
  try {
    await AuditLog.create({
      userId,
      ipAddress,
      actionType,
      details
    });
  } catch (err) {
    console.error("❌ Failed to write audit log:", err.message);
  }
}
