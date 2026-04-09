import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import api from "../../api/client";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import toast from "react-hot-toast";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [totalWorkingDays, setTotalWorkingDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/attendance/me");

        setStudent(data.student);
        setAttendance(data.attendance || []);
        setTotalWorkingDays(data.totalWorkingDays || 0);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load attendance");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ UNIQUE DATES (MAIN FIX)
  const uniqueDates = useMemo(() => {
    const set = new Set();

    attendance.forEach((item) => {
      if (item.date) {
        set.add(item.date);
      }
    });

    return Array.from(set).sort().reverse();
  }, [attendance]);

  // 🔥 Percentage FIXED
  const percentage = useMemo(() => {
    if (!totalWorkingDays) return 0;
    return Number(((uniqueDates.length / totalWorkingDays) * 100).toFixed(2));
  }, [uniqueDates.length, totalWorkingDays]);

  const absentDays = Math.max(totalWorkingDays - uniqueDates.length, 0);

  // 🔥 Chart FIXED
  const distributionData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [uniqueDates.length, absentDays], // ✅ FIX
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0,
        hoverOffset: 12,
        cutout: "70%",
      },
    ],
  };

  const distributionOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { size: 12 },
        },
      },
    },
    layout: { padding: 10 },
  };

  const monthlyTrendData = useMemo(() => {
    const monthlyMap = {};

    uniqueDates.forEach((date) => {
      const month = date.slice(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });

    const labels = Object.keys(monthlyMap).sort();

    return {
      labels,
      datasets: [
        {
          label: "Monthly Attendance",
          data: labels.map((m) => monthlyMap[m]),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [uniqueDates]);

  const [profileOpen, setProfileOpen] = useState(false);

  // ✅ TABLE FIX (NO DUPLICATES)
  const visibleAttendance = showAll
    ? uniqueDates
    : uniqueDates.slice(0, 5);

  return (
    <>
      <StudentNavbar onOpenProfile={() => setProfileOpen(true)} />

      <main className="container student-dashboard">
        {loading ? (
          <p className="empty-state">Loading dashboard...</p>
        ) : (
          <>
            {/* 🔥 WELCOME CARD (NO CHANGE) */}
            <div className="ui-card student-welcome">
              <div className="welcome-left">
                <div>
                  <h2>Welcome, {student?.name}</h2>
                  <p className="sub-text">Roll No: {student?.rollNumber}</p>

                  <p className="summary-text">
                    You attended <strong>{uniqueDates.length}</strong> out of{" "}
                    <strong>{totalWorkingDays}</strong> days
                  </p>
                </div>
              </div>

              <div className="welcome-right">
                <p>Attendance</p>
                <h1>{percentage}%</h1>
              </div>
            </div>

            {/* 🔥 STATS (FIXED VALUES ONLY) */}
            <div className="stats-grid">
              <div className="ui-kpi kpi-purple">
                <p>Total Days</p>
                <h2>{totalWorkingDays}</h2>
              </div>

              <div className="ui-kpi kpi-green">
                <p>Present</p>
                <h2>{uniqueDates.length}</h2>
              </div>

              <div className="ui-kpi kpi-orange">
                <p>Absent</p>
                <h2>{absentDays}</h2>
              </div>
            </div>

            {/* 🔥 CHARTS (NO CSS CHANGE) */}
            <div className="charts-grid">
              <div className="ui-card ui-card-chart student-chart-card">
                <h3>📊 Attendance Distribution</h3>

                <div className="student-chart-box">
                  <Doughnut
                    data={distributionData}
                    options={distributionOptions}
                  />
                </div>
              </div>

              <div className="ui-card ui-card-chart student-chart-card">
                <h3>📈 Monthly Attendance</h3>

                <div className="student-line-chart">
                  <Line data={monthlyTrendData} />
                </div>
              </div>
            </div>

            {/* 🔥 TABLE (ONLY LOGIC FIXED) */}
            <div className="ui-card">
              <div className="toolbar">
                <h3>📋 Attendance History</h3>

                <button
                  className="btn-primary"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show Less" : "Show More"}
                </button>
              </div>

              {visibleAttendance.length === 0 ? (
                <p className="empty-state">No attendance records</p>
              ) : (
                <div className="table-wrap">
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleAttendance.map((date) => (
                        <tr key={date}>
                          <td>{date}</td>
                          <td>
                            <span className="badge-present">Present</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default StudentDashboard;