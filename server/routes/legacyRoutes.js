const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const candidateController = require("../controllers/candidateController");
const voterController = require("../controllers/voterController");
const adminController = require("../controllers/adminController");
const votingController = require("../controllers/votingController");
const studentController = require("../controllers/studentController");
const messageController = require("../controllers/messageController");
const upload = require("../middleware/uploadMiddleware");

// Auth
router.post("/login", authController.login);
router.post("/setPassword", authController.setPassword);
router.post("/requestPasswordReset", authController.requestPasswordReset);
router.post("/verifyResetOTP", authController.verifyResetOTP);
router.post("/resetPassword", authController.resetPassword);
router.post("/resendOTP", authController.resendOTP);
router.post("/adminlogin", authController.adminLogin);

// Candidates
router.post("/createCandidate", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'symbol', maxCount: 1 },
    { name: 'authenticatedDocument', maxCount: 1 }
]), candidateController.createCandidate);
router.get("/getCandidate", candidateController.getCandidates);
router.post("/approveCandidate/:id", candidateController.approveCandidate);
router.post("/rejectCandidate/:id", candidateController.rejectCandidate);
router.patch("/updateCandidate/:id", candidateController.updateCandidate);
router.delete("/deleteCandidate/:id", candidateController.deleteCandidate);

// Voters
router.get("/getVoter", voterController.getVoters);
router.get("/getVoterbyID/:id", voterController.getVoterById);
router.patch("/updateVoter/:id", voterController.updateVoter);
router.post("/uploadVoterPhoto/:id", upload.single("photo"), voterController.uploadPhoto);

// Voting
router.post("/vote", votingController.vote);
router.get("/api/votingSettings", votingController.getVotingSettings); // Legacy prefixed
router.post("/api/votingSettings", votingController.updateVotingSettings); // Legacy prefixed
router.post("/api/requestOTP", votingController.requestOTP); // Legacy prefixed
router.post("/api/verifyOTP", votingController.verifyOTP); // Legacy prefixed

// Students
router.post("/api/studentList/upload", upload.single("file"), studentController.uploadStudentList);
router.get("/api/studentList", studentController.getStudents);

// Admin
router.post("/api/admin/distributeOTPs", adminController.distributeOTPs);
router.get("/api/votingReport", adminController.getVotingReport);
router.post("/api/start-new-election", adminController.startNewElection);
router.post("/api/reset-election", adminController.resetElection);
router.get("/getDashboardData", adminController.getDashboardData);
router.get("/api/winnersByPosition", candidateController.getCandidatesByPosition);

// Messages
router.post("/contact", messageController.submitContactForm);
router.get("/contacts", messageController.getContacts);
router.post("/contact/reply/:id", messageController.replyToContact);

module.exports = router;
