const { Types } = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.getVoters = async (req, res) => {
    try {
        const allVoters = await User.find({
            role: { $nin: ["candidate", "admin"] }
        })
            .select("name email voterId voteStatus college department img _id role createdAt")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, voter: allVoters });
    } catch (err) {
        console.error("Error fetching voters:", err);
        res.status(500).json({ success: false, message: "Error fetching voters" });
    }
};

exports.getVoterById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const voter = await User.findById(id).select("name email voterId voteStatus college department img role party bio age cgpa position").lean();
        if (!voter) return res.status(404).json({ success: false, message: "User not found" });

        res.json({ success: true, voter });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching user" });
    }
};

exports.updateVoter = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const { name, email, voterId, college, department, voteStatus, password } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: "Invalid email" });
            updateData.email = email;
        }
        if (voterId !== undefined) {
            const wcuPattern = /^WCU\d{7}$/;
            if (!wcuPattern.test(voterId)) return res.status(400).json({ success: false, message: "Invalid Student ID" });

            const existingStudent = await User.findOne({ voterId, _id: { $ne: id } });
            if (existingStudent) return res.status(400).json({ success: false, message: "Student ID exists" });
            updateData.voterId = voterId;
        }
        if (college !== undefined) updateData.college = college;
        if (department !== undefined) updateData.department = department;
        if (voteStatus !== undefined) updateData.voteStatus = !!voteStatus;

        if (password !== undefined && password !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await User.findOneAndUpdate(
            { _id: id, role: { $in: ["voter", undefined, null] } },
            updateData,
            { new: true, runValidators: true }
        ).select("name email voterId college department voteStatus img");

        if (!updated) return res.status(404).json({ success: false, message: "Voter not found" });

        res.json({ success: true, message: "Voter updated", voter: updated });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, message: "Duplicate record" });
        res.status(500).json({ success: false, message: "Error updating" });
    }
};

exports.deleteVoter = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const deleted = await User.findOneAndDelete({
            _id: id,
            role: { $in: ["voter", undefined, null] }
        });

        if (!deleted) return res.status(404).json({ success: false, message: "Voter not found" });
        res.json({ success: true, message: "Voter deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting" });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid id" });
        if (!req.file) return res.status(400).json({ success: false, message: "No photo" });

        const photoUrl = `/uploads/${req.file.filename}`;
        const updated = await User.findByIdAndUpdate(id, { img: photoUrl }, { new: true }).select("name img");

        if (!updated) return res.status(404).json({ success: false, message: "Voter not found" });
        res.json({ success: true, message: "Photo uploaded", img: photoUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error uploading" });
    }
};
