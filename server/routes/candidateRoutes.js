const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const upload = require("../middleware/uploadMiddleware");

router.post("/register", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'symbol', maxCount: 1 },
    { name: 'authenticatedDocument', maxCount: 1 }
]), candidateController.createCandidate);

router.get("/all", candidateController.getCandidates);
router.get("/pending", candidateController.getPendingCandidates);
router.get("/by-position", candidateController.getCandidatesByPosition);
router.post("/approve/:id", candidateController.approveCandidate);
router.post("/reject/:id", candidateController.rejectCandidate);
router.post("/reset-status/:id", candidateController.resetCandidateStatus);
router.delete("/:id", candidateController.deleteCandidate);
router.patch("/update/:id", candidateController.updateCandidate);
router.post("/assign-positions", candidateController.assignPositions);
router.post("/update-departments", candidateController.updateCandidateDepartments);

module.exports = router;
