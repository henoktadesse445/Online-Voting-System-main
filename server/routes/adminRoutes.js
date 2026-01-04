const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/health", adminController.getHealth);
router.get("/diagnostics", adminController.getDiagnostics);
router.post("/clear-voters", adminController.clearVoters);
router.post("/archive-election", adminController.archiveElection);
router.post("/reset-election", adminController.resetElection);
router.post("/start-new-election", adminController.startNewElection);
router.get("/election-history", adminController.getElectionHistory);
router.get("/dashboard-data", adminController.getDashboardData);
router.get("/voting-report", adminController.getVotingReport);
router.post("/distribute-otps", adminController.distributeOTPs);
router.post("/test-email", adminController.testEmail);

module.exports = router;
