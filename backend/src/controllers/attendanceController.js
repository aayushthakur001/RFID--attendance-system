const { Parser } = require("json2csv");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");

const getDateString = (date = new Date()) =>
  date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const scanRfid = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    const deviceKey = req.headers["x-device-key"];

    if (process.env.RFID_DEVICE_KEY && deviceKey !== process.env.RFID_DEVICE_KEY) {
      return res.status(401).json({ message: "Invalid device key" });
    }

    if (!rfid_uid) {
      return res.status(400).json({ message: "rfid_uid is required" });
    }

    const student = await Student.findOne({ rfid_uid });

    if (!student) {
      return res.status(404).json({ message: "RFID not mapped to a student" });
    }

    const date = getDateString();
    const lastRecord = await Attendance.findOne({
      studentId: student._id,
      date,
    }).sort({ timestamp: -1 });
    
    const now = new Date();
    
    // ⛔ Double scan protection (5 sec)
    if (lastRecord && (now - new Date(lastRecord.timestamp)) < 5000) {
      return res.json({ message: "WAIT" });
    }
    
    let type = "IN";
    
    // 👉 Decide IN / OUT
    if (lastRecord && lastRecord.type === "IN") {
      type = "OUT";
    }
    
    const attendance = await Attendance.create({
      studentId: student._id,
      timestamp: now,
      date,
      type,
    });
    
    return res.status(201).json({
      message: type === "IN" ? "ENTRY" : "EXIT",
      attendance,
      student,
    });
    // const existing = await Attendance.findOne({ studentId: student._id, date });

    // if (existing) {
    //   return res.json({
    //     message: "Attendance already marked for today",
    //     attendance: existing,
    //     student,
    //   });
    // }

    // const attendance = await Attendance.create({
    //   studentId: student._id,
    //   timestamp: new Date(),
    //   date,
    // });

    // return res.status(201).json({
    //   message: "Attendance marked",
    //   attendance,
    //   student,
    // });
  } catch (error) {
    return res.status(500).json({ message: "Scan handling failed", error: error.message });
  }
};

dayjs.extend(isoWeek);

const getAttendance = async (req, res) => {
  try {
    const { date, type, studentId } = req.query;
    const filter = {};

    let baseDate = date ? dayjs(date) : dayjs();

    // 🔥 APPLY FILTER
    if (type) {
      let start, end;

      if (type === "day") {
        start = baseDate.startOf("day");
        end = baseDate.endOf("day");
      }

      else if (type === "week") {
        start = baseDate.startOf("isoWeek");
        end = baseDate.endOf("isoWeek");
      }

      else if (type === "month") {
        start = baseDate.startOf("month");
        end = baseDate.endOf("month");
      }

      filter.timestamp = {
        $gte: start.toDate(),
        $lte: end.toDate(),
      };
    }

    // 🔥 STUDENT FILTER
    if (studentId) {
      filter.studentId = studentId;
    }

    // 🔥 MAIN FIX (GROUPING)
    const attendance = await Attendance.aggregate([
      {
        $match: filter
      },
      {
        $sort: { timestamp: 1 } // oldest first
      },
      {
        $group: {
          _id: {
            studentId: "$studentId",
            date: "$date"
          },
          record: { $first: "$$ROOT" } // take first IN
        }
      },
      {
        $replaceRoot: { newRoot: "$record" }
      },
      {
        $sort: { timestamp: -1 }
      }
    ]);

    // 🔥 POPULATE (important after aggregate)
    await Student.populate(attendance, {
      path: "studentId",
      select: "name rollNumber rfid_uid"
    });

    res.json(attendance);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching attendance",
      error: error.message
    });
  }
};
// const getAttendance = async (req, res) => {
//   try {
//     const { date, from, to, studentId } = req.query;
//     const filter = {};

//     if (date) {
//       filter.date = date;
//     }

//     if (from || to) {
//       filter.timestamp = {};
//       if (from) {
//         filter.timestamp.$gte = new Date(from);
//       }
//       if (to) {
//         filter.timestamp.$lte = new Date(`${to}T23:59:59.999Z`);
//       }
//     }

//     if (studentId) {
//       filter.studentId = studentId;
//     }

//     const attendance = await Attendance.find(filter)
//       .populate("studentId", "name rollNumber rfid_uid")
//       .sort({ timestamp: -1 });

//     return res.json(attendance);
//   } catch (error) {
//     return res.status(500).json({ message: "Could not fetch attendance", error: error.message });
//   }
// };

const getAttendanceByStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "student") {
      const studentRecord = await Student.findOne({ userId: req.user._id });
      if (!studentRecord || studentRecord._id.toString() !== id) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const attendance = await Attendance.find({ studentId: id })
      .populate("studentId", "name rollNumber")
      .sort({ timestamp: -1 });

    return res.json(attendance);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch student attendance", error: error.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const [attendance, totalWorkingDays] = await Promise.all([
      Attendance.find({ studentId: student._id })
        .populate("studentId", "name rollNumber")
        .sort({ timestamp: -1 }),
      Attendance.distinct("date").then((dates) => dates.length),
    ]);

    return res.json({ student, attendance, totalWorkingDays });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch personal attendance", error: error.message });
  }
};



const getAttendanceAnalytics = async (_req, res) => {
  try {
    const [students, attendance] = await Promise.all([
      Student.find().sort({ name: 1 }),
      Attendance.find().sort({ timestamp: 1 }),
    ]);

    // ✅ helper (VERY IMPORTANT)
    const isPresent = (item) =>
      item.type === "IN" || item.type === undefined;

    // ✅ UNIQUE DATES
    const uniqueDates = [
      ...new Set(attendance.map((item) => item.date).filter(Boolean)),
    ].sort();

    const totalDays = uniqueDates.length || 1;

    // ✅ DAILY COUNT (unique student per day)
    const attendanceByDate = uniqueDates.map((d) => {
      const uniqueStudents = new Set();

      attendance.forEach((item) => {
        if (item.date === d && isPresent(item)) {
          uniqueStudents.add(item.studentId.toString());
        }
      });

      return {
        date: d,
        count: uniqueStudents.size,
      };
    });

    // ✅ PERCENTAGE (unique attendance per student)
    const attendancePercentageByStudent = students.map((student) => {
      const uniqueDays = new Set();

      attendance.forEach((item) => {
        if (
          isPresent(item) &&
          item.studentId.toString() === student._id.toString()
        ) {
          uniqueDays.add(item.date);
        }
      });

      const presentDays = uniqueDays.size;

      return {
        studentId: student._id,
        name: student.name || "N/A",
        rollNumber: student.rollNumber || "N/A",
        percentage: Number(((presentDays / totalDays) * 100).toFixed(2)),
      };
    });

    // ✅ MONTHLY TREND
    const monthlyMap = {};
    attendance.forEach((item) => {
      if (item.date && isPresent(item)) {
        const month = item.date.slice(0, 7);
        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
      }
    });

    const monthlyTrend = Object.keys(monthlyMap)
      .sort()
      .map((month) => ({ month, count: monthlyMap[month] }));

    return res.json({
      dailyAttendance: attendanceByDate,
      attendancePercentageByStudent,
      monthlyTrend,
      totalStudents: students.length,
      totalDays,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not fetch analytics",
      error: error.message,
    });
  }
};
const getAttendanceSessions = async (req, res) => {
  try {
    const { studentId, date } = req.query;

    if (!studentId || !date) {
      return res.status(400).json({ message: "studentId and date required" });
    }

    const records = await Attendance.find({ studentId, date })
      .sort({ timestamp: 1 });

    let sessions = [];
    let lastIn = null;

    records.forEach((rec) => {
      if (rec.type === "IN") {
        lastIn = rec.timestamp;
      } else if (rec.type === "OUT" && lastIn) {
        sessions.push({
          in: lastIn,
          out: rec.timestamp,
        });
        lastIn = null;
      }
    });

    return res.json({
      studentId,
      date,
      sessions,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch sessions",
      error: error.message,
    });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { date, type } = req.query;

    const filter = {};

    // 🔥 HANDLE DAY / WEEK / MONTH
    if (date && type) {
      let startDate, endDate;

      if (type === "day") {
        startDate = dayjs(date).startOf("day").toDate();
        endDate = dayjs(date).endOf("day").toDate();
      }

      if (type === "week") {
        startDate = dayjs(date).startOf("week").toDate();
        endDate = dayjs(date).endOf("week").toDate();
      }

      if (type === "month") {
        startDate = dayjs(date).startOf("month").toDate();
        endDate = dayjs(date).endOf("month").toDate();
      }

      filter.timestamp = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // 🔥 FETCH DATA
    const [students, rows] = await Promise.all([
      Student.find().sort({ name: 1 }),
      Attendance.find(filter).sort({ timestamp: 1 }),
    ]);

    // ✅ helper (old + new data support)
    const isPresent = (item) =>
      item.type === "IN" || item.type === undefined;

    // 🔥 GET UNIQUE DATES
    const uniqueDates = [
      ...new Set(rows.map((item) => item.date).filter(Boolean)),
    ].sort();

    // 🔥 CREATE MAP (student + date)
    const attendanceMap = new Map();

    rows.forEach((item) => {
      if (!isPresent(item)) return;

      const key = item.studentId.toString() + "_" + item.date;
      attendanceMap.set(key, true);
    });

    // 🔥 BUILD FINAL CSV ROWS
    const csvRows = students.map((student) => {
      const row = {
        name: student.name || "",
        rollNumber: student.rollNumber || "",
      };

      uniqueDates.forEach((d) => {
        const key = student._id.toString() + "_" + d;

        row[d] = attendanceMap.has(key) ? "Present" : "Absent";
      });

      return row;
    });

    // 🔥 HEADERS
    const fields = ["name", "rollNumber", ...uniqueDates];

    const parser = new Parser({ fields });
    const csv = parser.parse(csvRows);

    res.header("Content-Type", "text/csv");
    res.attachment(`attendance-${type || "all"}-${date || "all"}.csv`);

    return res.send(csv);

  } catch (error) {
    return res.status(500).json({
      message: "CSV export failed",
      error: error.message,
    });
  }
};

const getAttendanceLogs = async (req, res) => {
  try {
    const { date, type, studentId } = req.query;

    const filter = {};

    // 🔥 Date filter
    if (date) {
      const start = dayjs(date).startOf("day").toDate();
      const end = dayjs(date).endOf("day").toDate();

      filter.timestamp = {
        $gte: start,
        $lte: end,
      };
    }

    // 🔥 Type filter (IN / OUT)
    if (type && type !== "all") {
      filter.type = type;
    }

    // 🔥 Student filter
    if (studentId) {
      filter.studentId = studentId;
    }

    const logs = await Attendance.find(filter)
      .populate("studentId", "name rollNumber rfid_uid")
      .sort({ timestamp: -1 });

    res.json(logs);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch logs",
      error: error.message,
    });
  }
};
module.exports = {
  scanRfid,
  getAttendance,
  getAttendanceByStudent,
  getMyAttendance,
  getAttendanceAnalytics,
  exportAttendance,
  getAttendanceSessions,
  getAttendanceLogs
};