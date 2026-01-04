const { Types } = require("mongoose");
const StudentList = require("../models/StudentList");
const User = require("../models/User");
const OTP = require("../models/OTP");
const XLSX = require('xlsx');

const normalizeStudentId = (id) => {
    if (!id) return null;
    id = String(id).trim().toUpperCase().replace(/^WCUR/, 'WCU');
    const match = id.match(/^WCU(\d+)/);
    if (!match) return null;
    const num = match[1].slice(0, 7).padStart(7, '0');
    return `WCU${num}`;
};

const generateEmail = (firstName, lastName, studentId) => {
    const cleanFirstName = String(firstName || '').toLowerCase().replace(/[^a-z]/g, '');
    const cleanLastName = String(lastName || '').toLowerCase().replace(/[^a-z]/g, '');
    const idPart = studentId ? studentId.toLowerCase().replace('wcu', '') : '';
    return `${cleanFirstName}.${cleanLastName}.${idPart}@gmail.com`;
};

exports.uploadStudentList = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file" });

        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rawData.length) return res.status(400).json({ success: false, message: "Empty file" });

        const results = { imported: 0, skipped: 0, errors: [] };

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const keys = Object.keys(row);
            let studentIdKey = keys.find(k => /^(student|voter).?id|id$/i.test(k));
            let emailKey = keys.find(k => /^e.?mail$/i.test(k));
            let nameKey = keys.find(k => /^name|full.?name$/i.test(k));

            if (!studentIdKey || !nameKey) {
                results.errors.push({ row: i + 2, error: "Missing ID or Name" });
                continue;
            }

            const studentId = normalizeStudentId(row[studentIdKey]);
            if (!studentId) {
                results.errors.push({ row: i + 2, error: "Invalid ID" });
                continue;
            }

            const payload = {
                studentId,
                name: row[nameKey],
                email: emailKey ? row[emailKey] : generateEmail(row[nameKey].split(' ')[0], '', studentId),
                status: 'active'
            };

            await StudentList.findOneAndUpdate({ studentId }, payload, { upsert: true });
            results.imported++;
        }

        res.json({ success: true, ...results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { studentId: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const [students, totalCount] = await Promise.all([
            StudentList.find(query).sort({ createdAt: -1 }).lean(),
            StudentList.countDocuments(query)
        ]);

        res.json({ success: true, students, totalCount });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching students" });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await StudentList.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: "Student not found" });
        res.json({ success: true, student: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating" });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const deleted = await StudentList.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error" });
    }
};

exports.deleteAllStudents = async (req, res) => {
    try {
        const result = await StudentList.deleteMany({});
        res.json({ success: true, message: "All students deleted", deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting all students" });
    }
};

