const { Types } = require("mongoose");
const OTP = require("../models/OTP");
const { verifyOTPHash } = require("./otpHelpers");

// Rate limiting for OTP requests (in-memory)
// Note: In production, use Redis or a similar persistent store
const otpRateLimiter = new Map();
const OTP_RATE_LIMIT = {
    MAX_REQUESTS: 3,
    WINDOW_MS: 15 * 60 * 1000 // 15 minutes
};

/**
 * Check if voter has exceeded OTP request rate limit
 * @param {string} voterId - The voter's ID
 * @returns {Object} { allowed: boolean, retryAfter: number }
 */
const checkOTPRateLimit = (voterId) => {
    const now = Date.now();
    const voterRequests = otpRateLimiter.get(voterId) || [];

    // Remove expired requests
    const validRequests = voterRequests.filter(timestamp => now - timestamp < OTP_RATE_LIMIT.WINDOW_MS);

    if (validRequests.length >= OTP_RATE_LIMIT.MAX_REQUESTS) {
        const oldestRequest = Math.min(...validRequests);
        const retryAfter = Math.ceil((oldestRequest + OTP_RATE_LIMIT.WINDOW_MS - now) / 1000 / 60); // minutes
        return { allowed: false, retryAfter };
    }

    // Add current request
    validRequests.push(now);
    otpRateLimiter.set(voterId, validRequests);

    return { allowed: true, retryAfter: 0 };
};

/**
 * Unified OTP verification function for production use
 * @param {string} voterId - Voter's ObjectId
 * @param {string} otpCode - Plain OTP code provided by user
 * @param {Object} options - { isPreElectionOTP: boolean, isPasswordReset: boolean }
 * @returns {Promise<Object>} { success: boolean, message: string, otp?: Object }
 */
const verifyOTPCode = async (voterId, otpCode, options = {}) => {
    try {
        // Validate inputs
        if (!Types.ObjectId.isValid(voterId)) {
            return { success: false, message: "Invalid voter identity" };
        }

        if (!otpCode || otpCode.length !== 6) {
            return { success: false, message: "OTP must be a 6-digit code" };
        }

        // Build query based on requirements
        const query = {
            voterId: voterId,
            used: false
        };

        if (options.isPreElectionOTP !== undefined) {
            query.isPreElectionOTP = options.isPreElectionOTP;
        }
        if (options.isPasswordReset !== undefined) {
            query.isPasswordReset = options.isPasswordReset;
        }

        // Find unused OTPs matching criteria
        const otps = await OTP.find(query).sort({ createdAt: -1 });

        if (!otps || otps.length === 0) {
            return {
                success: false,
                message: "No active OTP found. Please request a new one."
            };
        }

        let expiredAny = false;
        for (const otp of otps) {
            // Check if OTP is expired
            if (new Date() > otp.expiresAt) {
                await OTP.findByIdAndUpdate(otp._id, { used: true });
                expiredAny = true;
                continue;
            }

            // Verify OTP code (compare hashed)
            const isMatch = await verifyOTPHash(otpCode, otp.code);

            if (isMatch) {
                return { success: true, message: "OTP verified correctly", otp };
            }
        }

        return {
            success: false,
            message: expiredAny && otps.every(o => o.used || new Date() > o.expiresAt)
                ? "Your OTP has expired. Please request a new one."
                : "Invalid OTP code. Please check and try again."
        };

    } catch (err) {
        console.error("Critical error in verifyOTPCode:", err);
        return { success: false, message: "Server error during OTP verification" };
    }
};

module.exports = {
    checkOTPRateLimit,
    verifyOTPCode,
};
