const express = require("express");
const router = express.Router();
const voterController = require("../controllers/voterController");
const upload = require("../middleware/uploadMiddleware");

router.get("/all", voterController.getVoters);
router.get("/:id", voterController.getVoterById);
router.patch("/:id", voterController.updateVoter);
router.delete("/:id", voterController.deleteVoter);
router.post("/upload-photo/:id", upload.single("photo"), voterController.uploadPhoto);

module.exports = router;
