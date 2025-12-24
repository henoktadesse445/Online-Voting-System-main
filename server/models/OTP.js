const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired OTPs
  },
  used: {
    type: Boolean,
    default: false,
  },
  isPreElectionOTP: {
    type: Boolean,
    default: false, // Marks OTPs sent before election for first-time login
  },
  isPasswordReset: {
    type: Boolean,
    default: false, // Marks OTPs for password reset
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to ensure one active OTP per voter (not used)
otpSchema.index({ voterId: 1, used: 1 });

// 🚀 Performance Optimization: Additional indexes for OTP queries
otpSchema.index({ voterId: 1, used: 1, expiresAt: 1 }); // Compound index for OTP validation
otpSchema.index({ email: 1 }); // Index for email lookups

module.exports = mongoose.model("OTP", otpSchema);

