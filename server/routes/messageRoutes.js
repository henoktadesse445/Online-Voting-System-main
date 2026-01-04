const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/contact", messageController.submitContactForm);
router.get("/contacts", messageController.getContacts);
router.post("/reply/:id", messageController.replyToContact);
router.patch("/status/:id", messageController.updateStatus);
router.delete("/:id", messageController.deleteContact);

module.exports = router;
