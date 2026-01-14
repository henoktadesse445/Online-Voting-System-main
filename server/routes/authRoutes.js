const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/setPassword", authController.setPassword);
router.post("/adminlogin", authController.adminLogin);

// Password Reset
router.post("/request-reset", authController.requestPasswordReset);
router.post("/verify-reset-otp", authController.verifyResetOTP);
router.post("/reset-password", authController.resetPassword);

// Resend OTP - support both route formats for compatibility
router.post("/resend-otp", authController.resendOTP);
router.post("/resendOTP", authController.resendOTP);

module.exports = router;
