import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Bar, Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Tooltip,
} from "chart.js";

import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast"; // 🔥 ADDED

// 🔥 register charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Tooltip,
  Legend
);

const Analytics = () => {
  const { auth } = useAuth();

  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState("month");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 FETCH DATA (DYNAMIC FILTER)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let endpoint = `/attendance?type=${filterType}`;

        if (dateFilter) {
          endpoint += `&date=${dateFilter}`;
        }

        const res = await api.get(endpoint);
        setData(res.data);

      } catch (err) {
        toast.error("Failed to load analytics"); // 🔥 TOAST ERROR
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) fetchData();
  }, [filterType, dateFilter, auth]);

  // 🔥 KPI CALCULATIONS
  const totalRecords = data.length;

  const todayRecords = data.filter((item) =>
    dayjs(item.timestamp).isSame(dayjs(), "day")
  ).length;

  const uniqueStudents = new Set(
    data.map((item) => item.studentId?._id)
  ).size;

  const avgAttendance = uniqueStudents
    ? (totalRecords / uniqueStudents).toFixed(1)
    : 0;

  // 🔥 STUDENT-WISE DATA (BAR CHART)
  const studentChart = useMemo(() => {
    const map = {};

    data.forEach((item) => {
      const name = item.studentId?.name || "Unknown";
      map[name] = (map[name] || 0) + 1;
    });

    return {
      labels: Object.keys(map),
      datasets: [
        {
          label: "Attendance Count",
          data: Object.values(map),
          backgroundColor: [
            "#6366f1",
            "#8b5cf6",
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [data]);

  // 🔥 TIME TREND (LINE CHART)
  const trendChart = useMemo(() => {
    const map = {};

    data.forEach((item) => {
      const key =
        filterType === "day"
          ? dayjs(item.timestamp).format("HH:mm")
          : filterType === "week"
          ? dayjs(item.timestamp).format("ddd")
          : dayjs(item.timestamp).format("DD");

      map[key] = (map[key] || 0) + 1;
    });

    return {
      labels: Object.keys(map),
      datasets: [
        {
          label: "Attendance Trend",
          data: Object.values(map),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#6366f1",
          pointRadius: 4,
        },
      ],
    };
  }, [data, filterType]);

  // 🔥 TOP STUDENT
  const topStudent = useMemo(() => {
    const map = {};

    data.forEach((item) => {
      const name = item.studentId?.name || "Unknown";
      map[name] = (map[name] || 0) + 1;
    });

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  }, [data]);

  return (
    <main className="container">

      {/* 🔥 FILTER BAR */}
      <div className="ui-card ui-card-filter toolbar toolbar--compact">

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="day">📅 Day</option>
          <option value="week">📆 Week</option>
          <option value="month">🗓 Month</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

      </div>

      {/* 🔥 LOADING */}
      {loading && <p>Loading analytics...</p>}

      {!loading && (
        <>
          {/* 🔥 KPI CARDS */}
          <div className="stats-grid">

            <div className="ui-kpi kpi-purple">
              <p>Total Records</p>
              <h3>{totalRecords}</h3>
            </div>

            <div className="ui-kpi kpi-blue">
              <p>Total Students</p>
              <h3>{uniqueStudents}</h3>
            </div>

            <div className="ui-kpi kpi-green">
              <p>Today Attendance</p>
              <h3>{todayRecords}</h3>
            </div>

            <div className="ui-kpi kpi-orange">
              <p>Avg Attendance</p>
              <h3>{avgAttendance}</h3>
            </div>

          </div>

          {/* 🔥 CHARTS */}
          <div className="charts-grid">

            <div className="ui-card ui-card-chart">
              <h3>📊 Student Performance</h3>
              <Bar data={studentChart} />
            </div>

            <div className="ui-card ui-card-chart">
              <h3>📈 Attendance Trend</h3>
              <Line data={trendChart} />
            </div>

          </div>

          {/* 🔥 INSIGHTS */}
          <div className="ui-card insights">

            <h3>🔥 Insights</h3>

            <p>
              🥇 Top Student{" "}
              <strong>
                {topStudent ? `${topStudent[0]} (${topStudent[1]})` : "N/A"}
              </strong>
            </p>

          </div>
        </>
      )}
    </main>
  );
};

export default Analytics;