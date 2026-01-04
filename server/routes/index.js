const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const candidateRoutes = require("./candidateRoutes");
const voterRoutes = require("./voterRoutes");
const adminRoutes = require("./adminRoutes");
const studentRoutes = require("./studentRoutes");
const votingRoutes = require("./votingRoutes");
const messageRoutes = require("./messageRoutes");

router.use("/auth", authRoutes);
router.use("/candidates", candidateRoutes);
router.use("/voters", voterRoutes);
router.use("/admin", adminRoutes);
router.use("/students", studentRoutes);
router.use("/voting", votingRoutes);
router.use("/messages", messageRoutes);

module.exports = router;
