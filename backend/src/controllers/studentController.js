const mongoose = require("mongoose");
const Student = require("../models/Student");
const User = require("../models/User");
const bcrypt = require("bcryptjs");


const createStudent = async (req, res) => {
  try {
    const { name, rollNumber, rfid_uid, email, password } = req.body;

    // 🔴 1. Basic validation
    if (!name || !rollNumber || !rfid_uid || !email || !password) {
      return res.status(400).json({
        message: "All fields (name, rollNumber, rfid_uid, email, password) are required",
      });
    }

    // 🔴 2. Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    // 🔴 3. Check duplicate roll number
    const rollExists = await Student.findOne({ rollNumber });
    if (rollExists) {
      return res.status(409).json({
        message: "Roll number already exists",
      });
    }

    // 🔴 4. Check duplicate RFID
    const rfidExists = await Student.findOne({ rfid_uid });
    if (rfidExists) {
      return res.status(409).json({
        message: "RFID UID already exists",
      });
    }

    // =========================
    // 🔁 CREATE USER
    // =========================
    const user = new User({
      name,
      email: email.toLowerCase(),
      password, // 🔥 will be hashed automatically by pre-save
      role: "student",
    });

    await user.save();

    // =========================
    // 🔁 CREATE STUDENT
    // =========================
    const student = new Student({
      name,
      rollNumber,
      rfid_uid,
      userId: user._id,
    });

    await student.save();

    return res.status(201).json({
      message: "Student created successfully 🎉",
      student,
    });

  } catch (err) {
    console.error("Create Student Error:", err);

    // 🔴 Mongoose Validation Error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    // 🔴 Duplicate Key Error (MongoDB fallback)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];

      return res.status(409).json({
        message: `${field} already exists`,
      });
    }

    return res.status(500).json({
      message: "Could not create student",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch students", error: error.message });
  }
};


const updateStudent = async (req, res) => {
  try {
    const { name, rollNumber, rfid_uid, email } = req.body;

    const student = await Student.findById(req.params.id).populate("userId");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const user = student.userId;

    // ❌ Block password update here
    if (req.body.password) {
      return res.status(400).json({
        message: "Password cannot be updated by admin",
      });
    }

    // =========================
    // 🔁 NAME UPDATE (BOTH)
    // =========================
    if (name !== undefined && name.trim() !== "") {
      student.name = name;
      user.name = name;
    }

    // =========================
    // 🔁 ROLL NUMBER UPDATE
    // =========================
    if (rollNumber && rollNumber !== student.rollNumber) {
      const exists = await Student.findOne({
        rollNumber,
        _id: { $ne: student._id },
      });

      if (exists) {
        return res.status(409).json({
          message: "Roll number already exists",
        });
      }

      student.rollNumber = rollNumber;
    }

    // =========================
    // 🔁 RFID UPDATE
    // =========================
    if (rfid_uid && rfid_uid !== student.rfid_uid) {
      const exists = await Student.findOne({
        rfid_uid,
        _id: { $ne: student._id },
      });

      if (exists) {
        return res.status(409).json({
          message: "RFID UID already exists",
        });
      }

      student.rfid_uid = rfid_uid;
    }

    // =========================
    // 🔁 EMAIL UPDATE (USER)
    // =========================
    if (email && email !== user.email) {
      const exists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (exists) {
        return res.status(409).json({
          message: "Email already in use",
        });
      }

      user.email = email.toLowerCase();
    }

    // =========================
    // 💾 SAVE BOTH
    // =========================
    await user.save();     // triggers mongoose validation
    await student.save();  // triggers mongoose validation

    return res.status(200).json({
      message: "Student updated successfully ✏️",
      student,
    });

  } catch (err) {
    console.error("Update Student Error:", err);

    // 🔴 Mongoose Validation Error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);

      return res.status(400).json({
        message: messages.join(", "),
      });
    }

    // 🔴 Duplicate Key Error (MongoDB)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];

      return res.status(409).json({
        message: `${field} already exists`,
      });
    }

    // 🔴 Default Error
    return res.status(500).json({
      message: "Error updating student",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;

    console.log("Incoming ID:", id);

    // 🔥 Convert to ObjectId explicitly
    const objectId = new mongoose.Types.ObjectId(id);

    const deleted = await Student.findOneAndDelete({ _id: objectId });

    if (!deleted) {
      console.log("❌ Student not found in DB");
      return res.status(404).json({
        message: "Student not found",
      });
    }

    console.log("✅ Deleted:", deleted.name);

    res.json({
      message: "Student deleted successfully",
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({
      message: "Error deleting student",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // 🔴 1. Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required",
      });
    }

    // 🔴 2. Prevent same password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from old password",
      });
    }

    // 🔴 3. Password strength check
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // 🔴 4. Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 🔴 5. Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect old password",
      });
    }

    // 🔴 6. Hash new password
    user.password = newPassword; // plain text

    await user.save();

    // 🟢 7. Success response
    return res.status(200).json({
      message: "Password updated successfully 🔐",
    });

  } catch (err) {
    console.error("Change Password Error:", err);

    return res.status(500).json({
      message: "Error updating password",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
module.exports = { createStudent, getStudents, updateStudent,deleteStudent,changePassword };