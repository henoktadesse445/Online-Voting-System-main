const User = require("../models/User");

/**
 * Middleware to check if user is authenticated (simple version based on userId in body/headers)
 * Note: Should be replaced with JWT in a real production environment
 */
const isAuthenticated = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error in auth middleware" });
    }
};

/**
 * Middleware to check if user is an admin
 */
const isAdmin = async (req, res, next) => {
    try {
        const adminId = req.headers['x-admin-id'] || req.body.adminId || req.query.adminId;

        // Check for hardcoded admin login bypass check if needed, 
        // but better to check DB for role: 'admin'
        if (!adminId) {
            return res.status(401).json({ success: false, message: "Admin authentication required" });
        }

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin access denied" });
        }

        req.admin = admin;
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error in admin middleware" });
    }
};

module.exports = {
    isAuthenticated,
    isAdmin
};
