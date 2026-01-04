const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const OTP = require("../models/OTP");
const StudentList = require("../models/StudentList");
const { verifyOTPCode, checkOTPRateLimit } = require("../utils/otpService");
const { generateSecureOTP, hashOTP } = require("../utils/otpHelpers");
const { createEmailTransporter } = require("../utils/emailService");
const nodemailer = require("nodemailer");

// Simple signup
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.json({ success: true, message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error registering user" });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { username, credential } = req.body;

        if (!username || !credential) {
            return res.json({ success: false, message: "Username and credential are required" });
        }

        const cleanedUsername = username?.trim() || "";
        const isEmail = cleanedUsername.includes("@");
        const normalizedUsername = isEmail ? cleanedUsername.toLowerCase() : cleanedUsername.toUpperCase();

        const query = isEmail ? { email: normalizedUsername } : { voterId: normalizedUsername };

        const user = await User.findOne(query);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.firstLoginCompleted) {
            const verification = await verifyOTPCode(user._id, credential, { isPreElectionOTP: true });

            if (!verification.success) {
                return res.json({
                    success: false,
                    message: verification.message,
                    isFirstTimeLogin: true
                });
            }

            await OTP.updateOne({ _id: verification.otp._id }, { used: true });

            return res.json({
                success: true,
                requiresPasswordChange: true,
                message: "OTP verified. Please set a new password.",
                userId: user._id.toString(),
                userInfo: {
                    name: user.name,
                    email: user.email,
                    voterId: user.voterId
                }
            });
        }

        const isPasswordValid = await bcrypt.compare(credential, user.password);
        if (!isPasswordValid) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        return res.json({
            success: true,
            message: "Login successful",
            voterObject: {
                id: user._id,
                name: user.name,
                email: user.email,
                voterId: user.voterId,
                voteId: user.voteId,
                role: user.role,
                voteStatus: user.voteStatus,
                college: user.college,
                department: user.department
            }
        });
    } catch (err) {
        console.error("Error in login:", err);
        res.json({ success: false, message: "Error during login" });
    }
};

// Set Password (mandatory after first login)
exports.setPassword = async (req, res) => {
    try {
        const { userId, newPassword, confirmPassword } = req.body;

        if (!userId || !newPassword || !confirmPassword) {
            return res.json({ success: false, message: "All fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: "Passwords do not match" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.firstLoginCompleted) {
            return res.json({ success: false, message: "Password has already been set for this account" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const voteId = `VOTE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        await User.updateOne(
            { _id: user._id },
            {
                password: hashedPassword,
                firstLoginCompleted: true,
                voteId
            }
        );

        return res.json({
            success: true,
            message: "Password set successfully. You can now login with your new password.",
            voterObject: {
                id: user._id,
                name: user.name,
                email: user.email,
                voterId: user.voterId,
                voteId,
                role: user.role,
                voteStatus: user.voteStatus,
                college: user.college,
                department: user.department
            }
        });
    } catch (err) {
        console.error("Error setting password:", err);
        res.json({ success: false, message: "Error setting password" });
    }
};

// Admin Login
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (username === "admin" && password === "admin@123") {
            let admin = await User.findOne({ role: 'admin' });
            const FALLBACK_ID = "6766786c4f039103c8120e98";

            if (!admin) {
                try {
                    admin = new User({
                        _id: FALLBACK_ID,
                        name: "Admin",
                        email: "admin@election.com",
                        role: "admin",
                        password: await bcrypt.hash("admin@123", 10)
                    });
                    await admin.save();
                } catch (e) {
                    console.error("Failed to create fallback admin:", e);
                }
            }

            res.json({
                success: true,
                message: "Admin login successful",
                adminObject: {
                    _id: admin ? admin._id : FALLBACK_ID,
                    username: "admin",
                    role: "admin"
                }
            });
        } else {
            res.json({ success: false, message: "Invalid admin credentials" });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error during admin login" });
    }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.json({ success: false, message: "Username or email is required" });
        }

        const cleanedUsername = username?.trim() || "";
        const isEmail = cleanedUsername.includes("@");
        const normalizedUsername = isEmail ? cleanedUsername.toLowerCase() : cleanedUsername.toUpperCase();
        const query = isEmail ? { email: normalizedUsername } : { voterId: normalizedUsername };

        const user = await User.findOne(query);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Rate Limit Check
        const rateLimit = checkOTPRateLimit(user._id.toString());
        if (!rateLimit.allowed) {
            return res.json({
                success: false,
                message: `Too many requests. Please try again in ${rateLimit.retryAfter} minutes.`
            });
        }

        if (!user.firstLoginCompleted) {
            return res.json({
                success: false,
                message: "Please complete your first login before resetting password. Use the OTP sent to your email."
            });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Invalidate previous reset OTPs
        await OTP.updateMany(
            { voterId: user._id, used: false, isPasswordReset: true },
            { used: true }
        );

        const hashedOTP = await hashOTP(otpCode);
        const newOTP = new OTP({
            voterId: user._id,
            code: hashedOTP,
            email: user.email,
            expiresAt,
            used: false,
            isPasswordReset: true
        });
        await newOTP.save();

        // Send Email
        try {
            const transporter = await createEmailTransporter();
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Password Reset OTP - Wachemo University Voting System",
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You have requested to reset your password for the Wachemo University Voting System.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Your Password Reset OTP:</strong></p>
            <h1 style="color: #e74c3c; font-size: 36px; letter-spacing: 5px; margin: 10px 0;">${otpCode}</h1>
          </div>
          <p><strong>This OTP will expire in 15 minutes.</strong></p>
          <p>If you did not request this reset, please ignore this email.</p>
        </div>`
            };

            await transporter.sendMail(mailOptions);
            const emailParts = user.email.split('@');
            const maskedEmail = emailParts[0].substring(0, 2) + '**@' + emailParts[1];

            res.json({
                success: true,
                message: "Password reset OTP sent to your email",
                email: maskedEmail
            });
        } catch (emailError) {
            console.error("Error sending OTP:", emailError);
            await OTP.findByIdAndDelete(newOTP._id);
            return res.json({ success: false, message: "Failed to send OTP email" });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error requesting password reset" });
    }
};

// Verify Reset OTP
exports.verifyResetOTP = async (req, res) => {
    try {
        const { username, otp } = req.body;
        if (!username || !otp) {
            return res.json({ success: false, message: "Username and OTP are required" });
        }

        const cleanedUsername = username?.trim() || "";
        const isEmail = cleanedUsername.includes("@");
        const normalizedUsername = isEmail ? cleanedUsername.toLowerCase() : cleanedUsername.toUpperCase();
        const query = isEmail ? { email: normalizedUsername } : { voterId: normalizedUsername };

        const user = await User.findOne(query);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const verification = await verifyOTPCode(user._id, otp, { isPasswordReset: true });
        if (!verification.success) {
            return res.json({ success: false, message: verification.message });
        }

        await OTP.findByIdAndUpdate(verification.otp._id, { used: true });

        const resetToken = `RST-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await User.findByIdAndUpdate(user._id, {
            passwordResetToken: resetToken,
            passwordResetExpiry: resetTokenExpiry
        });

        res.json({
            success: true,
            message: "OTP verified successfully",
            resetToken,
            userId: user._id.toString()
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error verifying OTP" });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { userId, resetToken, newPassword, confirmPassword } = req.body;

        if (!userId || !resetToken || !newPassword || !confirmPassword) {
            return res.json({ success: false, message: "All fields are required" });
        }

        if (newPassword !== confirmPassword) {
            return res.json({ success: false, message: "Passwords do not match" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
            });
        }

        const user = await User.findById(userId);
        if (!user || user.passwordResetToken !== resetToken) {
            return res.json({ success: false, message: "Invalid user or reset token" });
        }

        if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
            return res.json({ success: false, message: "Reset token has expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null
        });

        res.json({ success: true, message: "Password reset successfully" });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error resetting password" });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ success: false, message: "Username is required" });

        const cleanedUsername = username.trim();
        const isEmail = cleanedUsername.includes("@");
        const normalizedUsername = isEmail ? cleanedUsername.toLowerCase() : cleanedUsername.toUpperCase();
        const query = isEmail ? { email: normalizedUsername } : { voterId: normalizedUsername };

        const user = await User.findOne(query);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found. Please ensure you are a registered student." });
        }

        if (user.firstLoginCompleted) {
            return res.status(400).json({ success: false, message: "Account already set up. Please use your password or Forgot Password." });
        }

        const otpCode = generateSecureOTP();
        const hashedOTP = await hashOTP(otpCode);

        // Keep Pre-Election OTP status
        await OTP.findOneAndUpdate(
            { voterId: user._id, isPreElectionOTP: true },
            {
                code: hashedOTP,
                email: user.email,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Long expiry for pre-election
                used: false
            },
            { upsert: true }
        );

        const transporter = await createEmailTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'WCU Voting System - Your Login OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Login Verification</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>Your OTP for the Wachemo University Voting System is:</p>
                    <h1 style="color: #3498db; letter-spacing: 5px;">${otpCode}</h1>
                    <p>Use this code with your Student ID (<strong>${user.voterId}</strong>) to complete your first login.</p>
                    <p style="color: #7f8c8d; font-size: 12px;">If you did not request this, please ignore this email.</p>
                </div>
            `
        });

        res.json({ success: true, message: "OTP resent successfully. Please check your email." });
    } catch (err) {
        console.error("Resend OTP Error:", err);
        res.status(500).json({ success: false, message: "Could not send OTP. Please check your internet or contact support." });
    }
};
