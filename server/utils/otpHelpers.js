const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/**
 * Generate cryptographically secure 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
const generateSecureOTP = () => {
    const otp = crypto.randomInt(100000, 1000000);
    return otp.toString();
};

/**
 * Hash OTP code before storage
 * @param {string} code - Plain OTP code
 * @returns {Promise<string>} Hashed OTP code
 */
const hashOTP = async (code) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(code, salt);
};

/**
 * Verify OTP code against hashed version
 * @param {string} code - Plain OTP code to verify
 * @param {string} hashedCode - Hashed OTP code from database
 * @returns {Promise<boolean>} True if codes match
 */
const verifyOTPHash = async (code, hashedCode) => {
    return await bcrypt.compare(code, hashedCode);
};

module.exports = {
    generateSecureOTP,
    hashOTP,
    verifyOTPHash,
};
