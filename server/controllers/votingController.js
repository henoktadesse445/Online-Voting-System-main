const { Types } = require("mongoose");
const User = require("../models/User");
const OTP = require("../models/OTP");
const Vote = require("../models/Vote");
const VotingSettings = require("../models/VotingSettings");
const { verifyOTPCode, checkOTPRateLimit } = require("../utils/otpService");
const { generateSecureOTP, hashOTP } = require("../utils/otpHelpers");
const { createEmailTransporter } = require("../utils/emailService");
const { recalculatePositions } = require("../services/electionService");
const crypto = require("crypto");

exports.getVotingSettings = async (req, res) => {
    try {
        const settings = await VotingSettings.getSettings();
        const now = new Date();
        const isActive = settings.isVotingActive();

        res.json({
            success: true,
            settings: {
                startDate: settings.startDate,
                endDate: settings.endDate,
                isActive: settings.isActive,
                electionTitle: settings.electionTitle,
                votingActive: isActive,
                timeRemaining: isActive ? settings.endDate - now : 0,
                timeUntilStart: now < settings.startDate ? settings.startDate - now : 0,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching settings" });
    }
};

exports.updateVotingSettings = async (req, res) => {
    try {
        const { startDate, endDate, isActive, electionTitle } = req.body;

        if (startDate && endDate) {
            if (new Date(endDate) <= new Date(startDate)) {
                return res.status(400).json({ success: false, message: "End date must be after start date" });
            }
        }

        let settings = await VotingSettings.findOne();
        if (!settings) {
            settings = await VotingSettings.create({
                startDate: startDate || new Date(),
                endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isActive: isActive !== undefined ? isActive : true,
                electionTitle: electionTitle || "Wachemo University Election",
            });
        } else {
            if (startDate) settings.startDate = new Date(startDate);
            if (endDate) settings.endDate = new Date(endDate);
            if (isActive !== undefined) settings.isActive = isActive;
            if (electionTitle) settings.electionTitle = electionTitle;
            await settings.save();
        }

        res.json({ success: true, message: "Settings saved", settings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error saving settings" });
    }
};

exports.requestOTP = async (req, res) => {
    try {
        const { voterId } = req.body;
        if (!Types.ObjectId.isValid(voterId)) return res.status(400).json({ success: false, message: "Invalid ID" });

        const rateLimit = checkOTPRateLimit(voterId);
        if (!rateLimit.allowed) return res.status(429).json({ success: false, message: `Too many requests. Retry in ${rateLimit.retryAfter}m` });

        const voter = await User.findById(voterId);
        if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });
        if (voter.voteStatus) return res.status(409).json({ success: false, message: "Already voted" });

        await OTP.updateMany({ voterId, used: false }, { used: true });

        const otpCode = generateSecureOTP();
        const hashedOTP = await hashOTP(otpCode);
        const otp = new OTP({
            voterId,
            code: hashedOTP,
            email: voter.email,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        await otp.save();

        try {
            const transporter = await createEmailTransporter();
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: voter.email,
                subject: 'Your Voting OTP',
                html: `<h1>${otpCode}</h1>`
            });
            res.json({ success: true, message: "OTP sent" });
        } catch (emailErr) {
            await OTP.findByIdAndDelete(otp._id);
            res.status(500).json({ success: false, message: "Failed to send email" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error" });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { voterId, otpCode } = req.body;
        const result = await verifyOTPCode(voterId, otpCode);
        if (!result.success) return res.status(400).json({ success: false, message: result.message });

        await OTP.findByIdAndUpdate(result.otp._id, { used: true });
        res.json({ success: true, message: "OTP verified" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error" });
    }
};

exports.vote = async (req, res) => {
    try {
        const settings = await VotingSettings.getSettings();
        if (!settings.isVotingActive()) return res.status(403).json({ success: false, message: "Voting not active" });

        const { candidateId, voterId, otpCode } = req.body;
        const verify = await verifyOTPCode(voterId, otpCode);
        if (!verify.success) return res.status(400).json({ success: false, message: verify.message });

        const [candidate, voter] = await Promise.all([
            User.findOne({ _id: candidateId, role: "candidate" }),
            User.findById(voterId)
        ]);

        if (!candidate || !voter) return res.status(404).json({ success: false, message: "Not found" });
        if (voter.voteStatus) return res.status(409).json({ success: false, message: "Already voted" });

        let voteId = voter.voteId || crypto.randomBytes(8).toString("hex");

        const newVote = new Vote({ voterId, candidateId, voteId });
        await newVote.save();

        await Promise.all([
            User.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } }),
            User.findByIdAndUpdate(voterId, { voteStatus: true, voteId }),
            OTP.findByIdAndUpdate(verify.otp._id, { used: true })
        ]);

        await recalculatePositions();

        res.json({ success: true, message: "Vote cast successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error" });
    }
};
