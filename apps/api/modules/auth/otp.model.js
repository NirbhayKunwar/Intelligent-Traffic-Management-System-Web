import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// TTL Index to automatically delete documents when the expiresAt date is reached
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetOTP = mongoose.model("PasswordResetOTP", otpSchema);
