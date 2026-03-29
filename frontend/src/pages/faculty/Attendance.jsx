import { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { FiSearch } from "react-icons/fi";
import toast from "react-hot-toast"; // 🔥 ADDED

const Attendance = () => {
  const { auth } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [filterType, setFilterType] = useState("day");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const recordsPerPage = 10;

  // 🔥 LOAD DATA
  const loadData = async () => {
    try {
      let endpoint = `/attendance?type=${filterType}`;

      if (dateFilter) {
        endpoint += `&date=${dateFilter}`;
      }

      const res = await api.get(endpoint);
      setAttendance(res.data);

    } catch {
      toast.error("Failed to load attendance"); // 🔥 TOAST
    }
  };

  useEffect(() => {
    if (auth?.token) loadData();
  }, [auth, dateFilter, filterType]);

  // 🔥 EXPORT CSV
  const handleExport = async () => {
    try {
      let endpoint = "/attendance/export";

      if (dateFilter) {
        endpoint += `?date=${dateFilter}&type=${filterType}`;
      }

      const res = await api.get(endpoint, { responseType: "blob" });

      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `attendance-${filterType}-${dateFilter || "all"}.csv`;
      link.click();

      toast.success("Export started 📥"); // 🔥 SUCCESS TOAST

    } catch {
      toast.error("Export failed");
    }
  };

  // 🔥 FILTERED DATA
  const filteredData = attendance.filter((item) =>
    item.studentId?.name.toLowerCase().includes(search.toLowerCase()) ||
    item.studentId?.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  const startIndex = (currentPage - 1) * recordsPerPage;
  const currentData = filteredData.slice(
    startIndex,
    startIndex + recordsPerPage
  );

  // 🔥 STATS
  const total = filteredData.length;
  const lastScan = filteredData[0]?.studentId?.name || null;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, dateFilter]);

  return (
    <main className="container">

      {/* 🔥 STATS */}
      <div className="stats-grid">

        <div className="ui-kpi kpi-purple">
          <p>Total Records</p>
          <h2>{total}</h2>
        </div>

        <div className="ui-kpi kpi-blue">
          <p>Last Scan</p>
          {lastScan ? (
            <h2>{lastScan}</h2>
          ) : (
            <h2 className="empty-text">No Scan Yet</h2>
          )}
        </div>

        <div className="ui-kpi kpi-green">
          <p>Status</p>
          <h2 className="live-status">
            <span className="live-dot"></span> Live
          </h2>
        </div>

      </div>

      {/* 🔥 FILTER TOOLBAR */}
      <div className="ui-card ui-card-filter toolbar toolbar--full">

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
              {currentData.map((item) => (
                <tr key={item._id}>
                  <td>{item.studentId?.name}</td>
                  <td>{item.studentId?.rollNumber}</td>
                  <td>{item.date}</td>
                  <td>{dayjs(item.timestamp).format("HH:mm:ss")}</td>
                  <td>
                    <span className="badge-present">Present</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <p className="empty-state">No records found</p>
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

          <span>Page {currentPage} of {totalPages}</span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
          >
            Next ➡
          </button>

        </div>
      </section>

    </main>
  );
};

export default Attendance;