import { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";

const Logs = () => {
  const { auth } = useAuth();

  const [allLogs, setAllLogs] = useState([]);
  const [logs, setLogs] = useState([]);

  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [expandedRow, setExpandedRow] = useState(null); // 🔥 NEW

  const recordsPerPage = 10;

  // 🔥 LOAD DATA
  const loadData = async () => {
    try {
      const fullRes = await api.get(`/attendance/logs`);
      setAllLogs(fullRes.data);

      let endpoint = `/attendance/logs`;
      const params = [];

      if (dateFilter) params.push(`date=${dateFilter}`);
      if (typeFilter !== "all") params.push(`type=${typeFilter}`);

      if (params.length) {
        endpoint += `?${params.join("&")}`;
      }

      const res = await api.get(endpoint);
      setLogs(res.data);
    } catch {
      toast.error("Failed to load logs");
    }
  };

  // 🔥 AUTO REFRESH
// 🔥 AUTO REFRESH (SMART)
useEffect(() => {
  if (!auth?.token) return;

  loadData();

  // ❌ STOP auto refresh if filters/search applied
  if (search || dateFilter || typeFilter !== "all") return;

  const interval = setInterval(() => {
    loadData();
  }, 10000);

  return () => clearInterval(interval);
}, [auth, search, dateFilter, typeFilter]);

  // 🔁 FILTER CHANGE
  useEffect(() => {
    if (auth?.token) loadData();
  }, [dateFilter, typeFilter]);

  // 🔍 SEARCH
  const filteredData = logs.filter((item) => {
    const name = item.studentId?.name?.toLowerCase() || "";
    const roll = item.studentId?.rollNumber?.toLowerCase() || "";
    const query = search.toLowerCase();
  
    return name.includes(query) || roll.includes(query);
  });
  // 🔥 GROUPING LOGIC
  const groupedData = {};

  filteredData.forEach((log) => {
    const key = `${log.studentId?._id}_${log.date}`;

    if (!groupedData[key]) {
      groupedData[key] = {
        student: log.studentId,
        date: log.date,
        logs: [],
      };
    }

    groupedData[key].logs.push(log);
  });

  const groupedArray = Object.values(groupedData);

  // 🔥 PAGINATION
  const totalPages = Math.ceil(groupedArray.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;

  const currentData = groupedArray.slice(
    startIndex,
    startIndex + recordsPerPage
  );

  // 🔥 KPI LOGIC
  const today = dayjs().format("YYYY-MM-DD");

  const todayActivity = allLogs.filter((item) => item.date === today).length;

  const latestMap = new Map();

  allLogs.forEach((item) => {
    const id = item.studentId?._id;
    if (!id) return;

    if (
      !latestMap.has(id) ||
      new Date(item.timestamp) > new Date(latestMap.get(id).timestamp)
    ) {
      latestMap.set(id, item);
    }
  });

  const insideCount = Array.from(latestMap.values()).filter(
    (item) => item.type === "IN"
  ).length;

  const lastLog = [...allLogs].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )[0];

  const handleExport = () => {
    if (groupedArray.length === 0) {
      toast.error("No data to export");
      return;
    }
  
    const result = [];
  
    groupedArray.forEach((group) => {
      const sortedLogs = [...group.logs].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
  
      let checkIn = null;
      let checkOut = null;
      let totalMs = 0;
  
      for (let i = 0; i < sortedLogs.length; i++) {
        const log = sortedLogs[i];
  
        if (log.type === "IN") {
          if (!checkIn) checkIn = log.timestamp;
  
          const next = sortedLogs[i + 1];
  
          if (next && next.type === "OUT") {
            totalMs += new Date(next.timestamp) - new Date(log.timestamp);
            checkOut = next.timestamp;
            i++;
          } else {
            totalMs += new Date() - new Date(log.timestamp);
          }
        }
      }
  
      const hours = Math.floor(totalMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
      const totalTime = `${hours}h ${minutes}m`;
  
      const lastLog = sortedLogs[sortedLogs.length - 1];
  
      const status =
        lastLog?.type === "IN"
          ? "Inside"
          : lastLog?.type === "OUT"
          ? "Checked Out"
          : "Absent";
  
      result.push([
        group.student?.name || "",
        group.student?.rollNumber || "",
        group.date,
        checkIn ? dayjs(checkIn).format("hh:mm A") : "—",
        checkOut ? dayjs(checkOut).format("hh:mm A") : "—",
        totalTime,
        status,
      ]);
    });
  
    const headers = [
      "Name",
      "Roll No",
      "Date",
      "Check In",
      "Check Out",
      "Total Time",
      "Status",
    ];
  
    const csvContent =
      [headers, ...result]
        .map((row) => row.map((val) => `"${val}"`).join(","))
        .join("\n");
  
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
  
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_filtered_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🔁 RESET PAGE
  useEffect(() => {
    setExpandedRow(null);
  }, [search, dateFilter, typeFilter]);

  return (
    <main className="container">
      {/* 🔥 KPI */}
      <div id="logs-kpi">
        <div className="stats-grid">
          <div className="ui-kpi kpi-purple">
            <p>Inside Now</p>
            <h2>{insideCount > 0 ? insideCount : "—"}</h2>
            {insideCount === 0 && (
              <span className="sub-text">No one inside</span>
            )}
          </div>

          <div className="ui-kpi kpi-blue">
            <p>Today Activity</p>
            <h2>{todayActivity}</h2>
          </div>

          <div className="ui-kpi kpi-green">
            <p>Last Activity</p>
            {lastLog ? (
              <>
                <h3 className="last-name">{lastLog.studentId?.name}</h3>
                <p
                  className={lastLog.type === "IN" ? "text-green" : "text-red"}
                >
                  {lastLog.type}
                </p>
                <span className="time-text">
                  {dayjs(lastLog.timestamp).format("hh:mm A")}
                </span>
              </>
            ) : (
              <h2 className="empty-text">No Activity</h2>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 TOOLBAR */}
      <div className="ui-card ui-card-filter toolbar toolbar--full">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>

        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      {/* 🔥 TABLE */}
      <section className="ui-card ui-card-table">
        <div className="table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {currentData.map((group) => {
                const key = `${group.student?._id}_${group.date}`;

                const sortedLogs = group.logs.sort(
                  (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                );

                const firstLog = sortedLogs[0];
                const lastLog = sortedLogs[sortedLogs.length - 1];

                const status =
                  lastLog?.type === "IN"
                    ? "Inside"
                    : lastLog?.type === "OUT"
                    ? "Checked Out"
                    : "Absent";

                const isExpanded = expandedRow === key;

                return (
                  <>
                    <tr
                      key={key}
                      onClick={() => setExpandedRow(isExpanded ? null : key)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{group.student?.name}</td>
                      <td>{group.student?.rollNumber}</td>
                      <td>{group.date}</td>
                      <td>{dayjs(firstLog.timestamp).format("HH:mm")}</td>
                      <td>
                      <span className={status === "Inside" ? "badge-in" : "badge-out"}>
  {status}
</span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan="5">
                          <div style={{ padding: "10px" }}>
                            {sortedLogs.map((log) => (
                              <div
                                key={log._id}
                                style={{ marginBottom: "5px" }}
                              >
                                {dayjs(log.timestamp).format("HH:mm:ss")} —{" "}
                                <strong>{log.type}</strong>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          {groupedArray.length === 0 && (
            <p className="empty-state">No logs found</p>
          )}
        </div>

        {/* 🔥 PAGINATION */}
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
          >
            ⬅ Prev
          </button>

          <span>
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next ➡
          </button>
        </div>
      </section>
    </main>
  );
};

export default Logs;
