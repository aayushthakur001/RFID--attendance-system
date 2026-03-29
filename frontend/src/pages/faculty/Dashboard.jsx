import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast"; // 🔥 ADDED

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const { auth } = useAuth();
  const navigate = useNavigate();

  // 🔥 LOAD DATA WITH ERROR HANDLING
  const loadData = async () => {
    try {
      const [studentsRes, attendanceRes, analyticsRes] = await Promise.all([
        api.get("/students"),
        api.get("/attendance"),
        api.get("/attendance/analytics"),
      ]);

      setStudents(studentsRes.data);
      setAttendance(attendanceRes.data);
      setAnalytics(analyticsRes.data);

    } catch {
      toast.error("Failed to load dashboard data"); // 🔥 TOAST
    }
  };

  useEffect(() => {
    if (auth?.token) loadData();
  }, [auth]);

  // 🔹 SMALL SUMMARY CHART
  const dailyChartData = useMemo(() => {
    if (!analytics?.dailyAttendance) return null;

    return {
      labels: analytics.dailyAttendance.map((item) => item.date),
      datasets: [
        {
          label: "Daily Attendance",
          data: analytics.dailyAttendance.map((item) => item.count),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [analytics]);

  // 🏆 TOP STUDENTS
  const topStudents =
    analytics?.attendancePercentageByStudent
      ?.sort((a, b) => b.percentage - a.percentage)
      ?.slice(0, 5) || [];

  return (
    <main className="container">

      {/* 🔥 STATS */}
      <div className="stats-grid">

        <div className="ui-kpi kpi-purple">
          <p>Total Students</p>
          <h2>{students.length}</h2>
        </div>

        <div className="ui-kpi kpi-blue">
          <p>Total Days</p>
          <h2>{analytics?.totalDays || 0}</h2>
        </div>

        <div className="ui-kpi kpi-green">
          <p>Avg Attendance</p>
          <h2>
            {analytics?.attendancePercentageByStudent?.length
              ? Math.round(
                  analytics.attendancePercentageByStudent.reduce(
                    (acc, s) => acc + s.percentage,
                    0
                  ) /
                    analytics.attendancePercentageByStudent.length
                )
              : 0}%
          </h2>
        </div>

        <div className="ui-kpi kpi-orange">
          <p>Today Present</p>
          <h2>
            {attendance.filter(
              (a) => a.date === new Date().toISOString().slice(0, 10)
            ).length}
          </h2>
        </div>

      </div>

      {/* 🔥 MAIN GRID */}
      <div className="dashboard-grid">

        <div className="ui-card dashboard-card">
          <h3>Daily Attendance</h3>
          {dailyChartData ? (
            <Line data={dailyChartData} />
          ) : (
            <p className="empty-state">No data</p>
          )}
        </div>

        <div className="ui-card dashboard-card top-students">
          <h3>🏆 Top Students</h3>

          {topStudents.length > 0 ? (
            topStudents.map((s, i) => (
              <p key={s.studentId}>
                <span>{i + 1}. {s.rollNumber}</span>
                <strong>{s.percentage}%</strong>
              </p>
            ))
          ) : (
            <p className="empty-state">No data</p>
          )}
        </div>

      </div>

    </main>
  );
};

export default Dashboard;