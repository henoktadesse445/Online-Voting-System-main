const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const upload = require("../middleware/uploadMiddleware");

router.post("/upload", upload.single("file"), studentController.uploadStudentList);
router.get("/all", studentController.getStudents);
router.patch("/:id", studentController.updateStudent);
router.delete("/all", studentController.deleteAllStudents);
router.delete("/:id", studentController.deleteStudent);

module.exports = router;
