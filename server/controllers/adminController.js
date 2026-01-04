const { Types } = require("mongoose");
const mongoose = require("mongoose");
const User = require("../models/User");
const OTP = require("../models/OTP");
const Vote = require("../models/Vote");
const StudentList = require("../models/StudentList");
const VotingSettings = require("../models/VotingSettings");
const ElectionResult = require("../models/ElectionResult");
const { recalculatePositions } = require("../services/electionService");
const { clearCache } = require("../utils/cacheService");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateSecureOTP, hashOTP } = require("../utils/otpHelpers");
const { createEmailTransporter } = require("../utils/emailService");

exports.getHealth = (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMessages = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

    res.json({
        server: "running",
        database: {
            status: statusMessages[dbStatus] || "unknown",
            readyState: dbStatus,
            connected: dbStatus === 1,
            name: mongoose.connection.name,
            host: mongoose.connection.host
        }
    });
};

exports.getDiagnostics = async (req, res) => {
    try {
        const [totalUsers, voters, candidates, admins] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: { $in: ["voter", undefined, null] } }),
            User.countDocuments({ role: "candidate" }),
            User.countDocuments({ role: "admin" })
        ]);

        res.json({
            success: true,
            statistics: { totalUsers, voters, candidates, admins },
            connection: { status: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearVoters = async (req, res) => {
    try {
        await User.deleteMany({ role: { $nin: ["candidate", "admin"] } });
        await StudentList.deleteMany({});
        await OTP.deleteMany({});
        clearCache();
        res.json({ success: true, message: "All voters and student list data cleared." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error clearing voters" });
    }
};

exports.archiveElection = async (req, res) => {
    try {
        const settings = await VotingSettings.getSettings();
        const totalVotes = await Vote.countDocuments();
        const candidates = await User.find({ role: "candidate", approvalStatus: { $in: ["approved", null] } });

        if (candidates.length === 0 && totalVotes === 0) return res.status(400).json({ success: false, message: "Nothing to archive" });

        const archivedElection = await ElectionResult.create({
            electionTitle: settings.electionTitle || "Election Archive",
            startDate: settings.startDate,
            endDate: settings.endDate,
            totalVotes,
            results: candidates.map(c => ({
                candidateId: c._id,
                name: c.name,
                votes: c.votes || 0,
                position: c.position
            }))
        });

        res.json({ success: true, message: "Election archived", archiveId: archivedElection._id });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error archiving" });
    }
};

exports.resetElection = async (req, res) => {
    try {
        const { resetCandidates = true } = req.body;
        await Vote.deleteMany({});
        const settings = await VotingSettings.getSettings();
        settings.isActive = false;
        await settings.save();

        await User.updateMany({}, { $set: { voteStatus: false, voteId: null } });

        if (resetCandidates) {
            await User.updateMany({ role: "candidate" }, { $set: { role: "voter", votes: 0, position: null, approvalStatus: null } });
        } else {
            await User.updateMany({ role: "candidate" }, { $set: { votes: 0, position: null } });
        }

        clearCache();
        res.json({ success: true, message: "Election system reset successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error resetting" });
    }
};

exports.startNewElection = async (req, res) => {
    try {
        const { adminId, confirmationCode } = req.body;
        if (confirmationCode !== 'START_NEW_ELECTION') return res.status(400).json({ success: false, message: "Invalid code" });

        await Vote.deleteMany({});
        await User.updateMany({ role: 'candidate' }, { $set: { role: 'voter', votes: 0, position: null, approvalStatus: null } });
        await ElectionResult.deleteMany({});
        await User.updateMany({ role: { $ne: 'admin' } }, { $set: { voteStatus: false }, $unset: { voteId: "" } });
        await OTP.deleteMany({});
        clearCache();

        res.json({ success: true, message: "New election started successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error starting new election" });
    }
};

exports.getElectionHistory = async (req, res) => {
    try {
        const history = await ElectionResult.find().sort({ archivedAt: -1 }).lean();
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching history" });
    }
};

exports.getDashboardData = async (req, res) => {
    try {
        const [voterCount, candidateCount, votersVoted] = await Promise.all([
            StudentList.countDocuments({}),
            User.countDocuments({ role: "candidate", approvalStatus: { $in: ["approved", null] } }),
            User.countDocuments({ role: { $in: ["voter", "candidate", undefined, null] }, voteStatus: true })
        ]);

        res.json({ success: true, DashboardData: { voterCount, candidateCount, votersVoted } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching dashboard" });
    }
};

exports.getVotingReport = async (req, res) => {
    try {
        const settings = await VotingSettings.getSettings();
        // If election ended, ensure positions are calculated
        if (settings.endDate && new Date() > settings.endDate) {
            await recalculatePositions();
        }

        const totalVoters = await StudentList.countDocuments({});
        // totalVotesCast is the number of users who have actually voted
        const totalVotesCast = await User.countDocuments({ role: { $in: ["voter", "candidate"] }, voteStatus: true });
        const turnoutPercentage = totalVoters > 0 ? ((totalVotesCast / totalVoters) * 100).toFixed(2) : 0;

        const candidates = await User.find({
            role: "candidate",
            approvalStatus: { $in: ["approved", null] }
        }).sort({ votes: -1 }).lean();

        // Populate vote details for audit trail
        const voteDetailsRaw = await Vote.find({})
            .sort({ createdAt: -1 })
            .populate('candidateId', 'name position')
            .lean();

        const voteDetails = voteDetailsRaw.map(v => ({
            voteId: v.voteId || v._id.toString().substring(0, 8),
            candidateName: v.candidateId ? v.candidateId.name : 'Unknown Candidate',
            position: v.candidateId ? v.candidateId.position : 'N/A',
            timestamp: v.createdAt
        }));

        // Calculate statistics
        const voteCounts = candidates.map(c => c.votes || 0);
        const highestVotes = voteCounts.length > 0 ? Math.max(...voteCounts) : 0;
        const lowestVotes = voteCounts.length > 0 ? Math.min(...voteCounts) : 0;
        const totalCandidateVotes = voteCounts.reduce((a, b) => a + b, 0);
        const averageVotes = candidates.length > 0 ? (totalCandidateVotes / candidates.length).toFixed(1) : 0;

        res.json({
            success: true,
            report: {
                summary: {
                    totalVoters,
                    totalVotesCast,
                    turnoutPercentage,
                    totalCandidates: candidates.length,
                    reportGeneratedAt: new Date(),
                    electionDate: settings.startDate || new Date()
                },
                candidateResults: candidates.map((c, index) => ({
                    id: c._id,
                    name: c.name,
                    studentId: c.voterId || 'N/A',
                    department: c.department || 'N/A',
                    position: c.position || 'None',
                    votes: c.votes || 0,
                    percentage: totalVotesCast > 0 ? ((c.votes / totalVotesCast) * 100).toFixed(2) : 0
                })),
                voteDetails,
                statistics: {
                    averageVotesPerCandidate: averageVotes,
                    highestVotes,
                    lowestVotes
                }
            }
        });
    } catch (err) {
        console.error("Error in getVotingReport:", err);
        res.status(500).json({ success: false, message: "Error generating report" });
    }
};

exports.distributeOTPs = async (req, res) => {
    console.log("🚀 Starting OTP distribution process...");
    try {
        const students = await StudentList.find({});
        console.log(`📂 Found ${students.length} students in list.`);

        const results = { total: students.length, sent: 0, failed: 0, errors: [] };

        if (students.length === 0) {
            console.log("⚠️ No students found for distribution.");
            return res.json({ success: true, message: "No students", results });
        }

        const transporter = await createEmailTransporter();
        console.log("📧 Email transporter created.");

        // Clear only voters (not admins or candidates)
        console.log("🧹 Clearing existing voter accounts...");
        await User.deleteMany({ role: { $in: ['voter', undefined, null] } });

        // Process in small batches or use concurrency to avoid timeouts
        // For now, let's stick to the loop but add progress logging
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            console.log(`[${i + 1}/${students.length}] Processing student: ${student.studentId}`);

            try {
                if (!student.email) {
                    console.log(`❌ No email for student ${student.studentId}`);
                    results.failed++;
                    results.errors.push({ user: student.studentId, error: "No email" });
                    continue;
                }

                // Create user
                const password = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(password, 10);

                let user = new User({
                    name: student.name,
                    email: student.email,
                    voterId: student.studentId,
                    role: 'voter',
                    password: hashedPassword,
                    voteStatus: false,
                    department: student.department
                });
                await user.save();

                // Generate OTP
                const otpCode = generateSecureOTP();
                const hashedOTP = await hashOTP(otpCode);

                await OTP.findOneAndUpdate(
                    { voterId: user._id },
                    {
                        code: hashedOTP,
                        email: user.email,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        used: false,
                        isPreElectionOTP: true
                    },
                    { upsert: true }
                );

                console.log(`📤 Sending email to ${student.email}...`);
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'WCU Online Voting - Your Election Credentials',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                            <h2 style="color: #2c3e50;">Welcome to WCU Online Voting</h2>
                            <p>You have been registered for the upcoming election.</p>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                                <p><strong>Student ID:</strong> ${user.voterId}</p>
                                <p><strong>OTP Code:</strong> <span style="font-size: 20px; color: #3498db; letter-spacing: 2px;">${otpCode}</span></p>
                            </div>
                            <p style="color: #7f8c8d; font-size: 13px; margin-top: 20px;">
                                Use these credentials to login for the first time. You will be asked to set a password after verification.
                            </p>
                        </div>
                    `
                });

                results.sent++;
                console.log(`✅ Success for ${student.studentId}`);
            } catch (innerErr) {
                console.error(`❌ Failed for ${student.studentId}:`, innerErr.message);
                results.failed++;
                results.errors.push({ user: student.studentId, error: innerErr.message });
            }
        }

        console.log(`🏁 Distribution complete. Sent: ${results.sent}, Failed: ${results.failed}`);
        res.json({ success: true, message: "Distribution complete", results });
    } catch (err) {
        console.error("🔥 CRITICAL ERROR in OTP distribution:", err);
        res.status(500).json({ success: false, message: "Error in distribution", error: err.message });
    }
};

exports.testEmail = async (req, res) => {
    try {
        const { testEmail } = req.body;
        if (!testEmail) return res.status(400).json({ success: false, message: "Email required" });

        const transporter = await createEmailTransporter();
        const testOTP = generateSecureOTP();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: testEmail,
            subject: 'Test Email',
            html: `<h1>${testOTP}</h1>`
        });

        res.json({ success: true, message: "Test email sent" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Test failed", error: err.message });
    }
};
