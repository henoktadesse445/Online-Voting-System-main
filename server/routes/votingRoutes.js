const express = require("express");
const router = express.Router();
const votingController = require("../controllers/votingController");

router.get("/settings", votingController.getVotingSettings);
router.post("/settings", votingController.updateVotingSettings);
router.post("/request-otp", votingController.requestOTP);
router.post("/verify-otp", votingController.verifyOTP);
router.post("/vote", votingController.vote);

module.exports = router;
