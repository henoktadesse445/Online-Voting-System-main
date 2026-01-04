const { Types } = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const StudentList = require("../models/StudentList");

const { recalculatePositions } = require("../services/electionService");

exports.createCandidate = async (req, res) => {
    try {
        const { fullName, party, bio, age, cgpa, position, userId } = req.body;

        const imageFile = req.files && req.files.image ? req.files.image[0] : null;
        const symbolFile = req.files && req.files.symbol ? req.files.symbol[0] : null;
        const documentFile = req.files && req.files.authenticatedDocument ? req.files.authenticatedDocument[0] : null;

        const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : undefined;
        const symbolUrl = symbolFile ? `/uploads/${symbolFile.filename}` : undefined;
        const documentUrl = documentFile ? `/uploads/${documentFile.filename}` : undefined;

        if (userId) {
            if (!Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ success: false, message: "Invalid user ID" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (user.voterId) {
                const studentInList = await StudentList.findOne({
                    studentId: user.voterId,
                    status: "active"
                });

                if (!studentInList) {
                    return res.status(403).json({
                        success: false,
                        message: "Your Student ID is not found in the authorized student list."
                    });
                }
            }

            if (user.role === "candidate") {
                return res.status(400).json({ success: false, message: "You are already registered as a candidate" });
            }

            if (user.approvalStatus === "pending") {
                return res.status(400).json({ success: false, message: "You already have a pending candidate application" });
            }

            if (!documentUrl) {
                return res.status(400).json({ success: false, message: "Authenticated document is required." });
            }

            const updateData = {
                role: "candidate",
                party,
                bio,
                age: age ? parseInt(age) : undefined,
                cgpa: cgpa ? parseFloat(cgpa) : undefined,
                position: position || undefined,
                approvalStatus: "pending",
                authenticatedDocument: documentUrl
            };

            if (fullName && fullName.trim()) updateData.name = fullName.trim();
            if (imageUrl) updateData.img = imageUrl;
            if (symbolUrl) updateData.symbol = symbolUrl;

            await User.findByIdAndUpdate(userId, updateData);

            return res.json({ success: true, message: "Candidate registration submitted successfully. Waiting for admin approval." });
        }

        // Admin creation mode
        const candidateEmail = req.body.email || `candidate_${Date.now()}@temp.com`;
        const candidateVoterId = req.body.voterId || undefined;

        if (req.body.email) {
            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser) return res.status(400).json({ success: false, message: "Email already exists" });
        }

        if (candidateVoterId) {
            const existingStudent = await User.findOne({ voterId: candidateVoterId });
            if (existingStudent) return res.status(400).json({ success: false, message: "Student ID already exists" });
        }

        const candidateData = {
            name: fullName,
            email: candidateEmail,
            voterId: candidateVoterId,
            password: await bcrypt.hash("temp_password", 10),
            role: "candidate",
            party,
            bio,
            age: age ? parseInt(age) : undefined,
            cgpa: cgpa ? parseFloat(cgpa) : undefined,
            img: imageUrl,
            symbol: symbolUrl,
            approvalStatus: "approved",
            voteStatus: false,
        };

        const newCandidate = new User(candidateData);
        await newCandidate.save();

        res.json({ success: true, message: "Candidate registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error registering candidate" });
    }
};

exports.getCandidates = async (req, res) => {
    try {
        const candidate = await User.find({
            role: "candidate",
            approvalStatus: { $in: ["approved", null] }
        })
            .select("name party bio age cgpa role img symbol votes department position")
            .lean();

        const candidatesWithDepartment = candidate.map(c => ({
            ...c,
            department: c.department || c.party || 'Not specified'
        }));
        res.json({ success: true, candidate: candidatesWithDepartment });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error fetching candidates" });
    }
};

exports.getPendingCandidates = async (req, res) => {
    try {
        const candidates = await User.find({
            role: "candidate",
            approvalStatus: "pending"
        })
            .select("name email voterId department position bio cgpa img symbol authenticatedDocument createdAt")
            .lean();

        res.json({ success: true, candidates });
    } catch (err) {
        console.error("Error in getPendingCandidates:", err);
        res.status(500).json({ success: false, message: "Error fetching pending candidates" });
    }
};

exports.getCandidatesByPosition = async (req, res) => {
    try {
        const validPositions = [
            "President", "Vice President", "Secretary", "Finance Officer",
            "Public Relations Officer", "Sports & Recreation Officer", "Gender and Equality Officer"
        ];

        const candidates = await User.find({
            role: "candidate",
            approvalStatus: { $in: ["approved", null] }
        }).select("name party bio age cgpa role img symbol votes department position");

        const candidatesByPosition = {};
        const allCandidates = candidates.map(c => ({
            ...c.toObject(),
            department: c.department || c.party || 'Not specified'
        }));

        const hasAssignedPositions = candidates.some(c => c.position);
        if (hasAssignedPositions) {
            validPositions.forEach(position => {
                candidatesByPosition[position] = candidates
                    .filter(c => c.position === position)
                    .map(c => ({
                        ...c.toObject(),
                        department: c.department || c.party || 'Not specified'
                    }));
            });
        } else {
            validPositions.forEach(position => {
                candidatesByPosition[position] = allCandidates;
            });
        }

        const winners = {};
        validPositions.forEach(pos => {
            const winnerCandidate = candidates.find(c => c.position === pos);
            if (winnerCandidate) {
                winners[pos] = {
                    candidate: {
                        ...winnerCandidate.toObject(),
                        department: winnerCandidate.department || winnerCandidate.party || 'Not specified'
                    },
                    voteCount: winnerCandidate.votes || 0
                };
            }
        });

        res.json({ success: true, candidatesByPosition, winners });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching candidates by position" });
    }
};

exports.approveCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid candidate ID" });

        const candidate = await User.findByIdAndUpdate(
            id,
            { approvalStatus: "approved" },
            { new: true }
        ).select("name email approvalStatus role");

        if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
        if (candidate.role !== "candidate") return res.status(400).json({ success: false, message: "User is not a candidate" });

        res.json({ success: true, message: "Candidate approved successfully", candidate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error approving candidate" });
    }
};

exports.rejectCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid candidate ID" });

        const candidate = await User.findByIdAndUpdate(
            id,
            { approvalStatus: "rejected" },
            { new: true }
        ).select("name email approvalStatus");

        if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });

        res.json({ success: true, message: "Candidate rejected successfully", candidate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error rejecting candidate" });
    }
};

exports.resetCandidateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid candidate ID" });

        const candidate = await User.findByIdAndUpdate(
            id,
            { approvalStatus: null, role: "voter" },
            { new: true }
        ).select("name email approvalStatus role");

        if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });

        res.json({ success: true, message: "Candidate status reset successfully.", candidate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error resetting candidate status" });
    }
};

exports.deleteCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await User.findOneAndDelete({ _id: id, role: "candidate" });
        if (!deleted) return res.json({ success: false, message: "Candidate not found" });
        res.json({ success: true, message: "Candidate deleted" });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Error deleting candidate" });
    }
};

exports.updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid candidate id" });

        const user = await User.findById(id);
        if (!user || user.role !== "candidate") return res.status(400).json({ success: false, message: "Candidate not found" });

        const validPositions = [
            "President", "Vice President", "Secretary", "Finance Officer",
            "Public Relations Officer", "Sports & Recreation Officer", "Gender and Equality Officer"
        ];

        const { name, party, bio, cgpa, age, email, voterId, password, position } = req.body;
        const update = {};
        if (name !== undefined) update.name = name;
        if (party !== undefined) update.party = party;
        if (bio !== undefined) update.bio = bio;

        if (cgpa !== undefined && cgpa !== '') {
            const cgpaValue = parseFloat(cgpa);
            if (isNaN(cgpaValue) || cgpaValue < 0 || cgpaValue > 4.0) {
                return res.status(400).json({ success: false, message: "CGPA must be 0-4.0" });
            }
            update.cgpa = cgpaValue;
        }

        if (age !== undefined && age !== '') {
            const ageValue = parseInt(age);
            if (!isNaN(ageValue)) {
                update.age = ageValue;
            }
        }

        if (position !== undefined) {
            if (position && !validPositions.includes(position)) {
                return res.status(400).json({ success: false, message: "Invalid position" });
            }
            update.position = position || null;
        }

        if (email !== undefined) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: "Invalid email" });

            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) return res.status(400).json({ success: false, message: "Email already exists" });
            update.email = email;
        }

        if (voterId !== undefined) {
            const wcuPattern = /^WCU\d{7}$/;
            if (!wcuPattern.test(voterId)) return res.status(400).json({ success: false, message: "Invalid Student ID" });

            const existingStudent = await User.findOne({ voterId, _id: { $ne: id } });
            if (existingStudent) return res.status(400).json({ success: false, message: "Student ID already exists" });
            update.voterId = voterId;
        }

        if (password !== undefined && password !== '') {
            update.password = await bcrypt.hash(password, 10);
        }

        const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
        res.json({ success: true, candidate: updated, message: "Candidate updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating candidate" });
    }
};

exports.assignPositions = async (req, res) => {
    try {
        const assignments = await recalculatePositions();
        if (assignments.length === 0) return res.status(400).json({ success: false, message: "No candidates found" });
        res.json({ success: true, message: `Positions assigned to ${assignments.length} candidates.`, assignments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error assigning positions" });
    }
};

// Internal utility for other controllers
exports.recalculatePositionsInternal = recalculatePositions;

exports.updateCandidateDepartments = async (req, res) => {
    try {
        const departmentMappings = [
            { namePattern: /habtamu/i, department: 'Computer Science' },
            { namePattern: /henok/i, department: 'Information System' },
            { namePattern: /misgana/i, department: 'Chemical Engineering' },
            { namePattern: /wonde/i, department: 'Medicine' }
        ];

        const updates = [];
        for (const mapping of departmentMappings) {
            const result = await User.updateMany(
                { role: 'candidate', name: { $regex: mapping.namePattern } },
                { $set: { party: mapping.department, department: mapping.department } }
            );
            updates.push({
                pattern: mapping.namePattern.toString(),
                department: mapping.department,
                updated: result.modifiedCount
            });
        }

        const updatedCandidates = await User.find({ role: 'candidate' }).select('name party');
        res.json({
            success: true,
            message: "Candidate departments updated successfully",
            updates,
            candidates: updatedCandidates.map(c => ({ name: c.name, department: c.party }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating departments" });
    }
};
