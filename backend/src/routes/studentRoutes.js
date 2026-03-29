const express = require("express");
const { createStudent, getStudents, updateStudent, deleteStudent,changePassword } = require("../controllers/studentController");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.post("/", protect, authorize("faculty"), createStudent);
router.get("/", protect, authorize("faculty"), getStudents);
// ✅ UPDATE
router.put("/change-password", protect, authorize("student"), changePassword); // ✅ student only
router.put("/:id", protect, authorize("faculty"), updateStudent); // ✅ admin/faculty only
// ✅ DELETE 🔥 IMPORTANT
router.delete("/:id", protect, authorize("faculty"), deleteStudent);

module.exports = router;