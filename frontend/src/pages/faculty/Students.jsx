import { useEffect, useState, useMemo } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";

const Students = () => {
  const { auth } = useAuth();
  const studentsPerPage = 5;

  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("none");
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    name: "",
    rollNumber: "",
    rfid_uid: "",
    email: "",
    password: "",
  });

  // ✅ Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, analyticsRes] = await Promise.all([
        api.get("/students"),
        api.get("/attendance/analytics"),
      ]);

      setStudents(studentsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) loadData();
  }, [auth]);

  // ✅ Reset page on filter/search/sort
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, sort]);

  // ✅ Percentage Map (PERFORMANCE FIX)
  const percentageMap = useMemo(() => {
    if (!analytics?.attendancePercentageByStudent) return {};

    const map = {};
    analytics.attendancePercentageByStudent.forEach((s) => {
      map[s.studentId] = s.percentage;
    });

    return map;
  }, [analytics]);

  const getPercentage = (id) => percentageMap[id] || 0;

  // ✅ Enriched Students (BEST PRACTICE)
  const enrichedStudents = useMemo(() => {
    return students.map((s) => ({
      ...s,
      percentage: getPercentage(s._id),
    }));
  }, [students, percentageMap]);

  // ✅ Filter + Search + Sort
  const processedStudents = useMemo(() => {
    let data = [...enrichedStudents];

    // FILTER
    if (filter === "high") {
      data = data.filter((s) => s.percentage > 75);
    } else if (filter === "medium") {
      data = data.filter((s) => s.percentage > 40 && s.percentage <= 75);
    } else if (filter === "low") {
      data = data.filter((s) => s.percentage <= 40);
    }

    // SEARCH
    if (search) {
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.rollNumber.includes(search)
      );
    }

    // SORT
    if (sort === "name") {
      data.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "percent") {
      data.sort((a, b) => b.percentage - a.percentage);
    }

    return data;
  }, [enrichedStudents, filter, sort, search]);

  // ✅ Pagination
  const indexOfLast = currentPage * studentsPerPage;
  const indexOfFirst = indexOfLast - studentsPerPage;
  const paginatedStudents = processedStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedStudents.length / studentsPerPage);

  // ✅ Form Handlers
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();


    try {
      const payload = { ...form };

      if (!payload.password) delete payload.password;



      if (editingId) {
        const res = await api.put(`/students/${editingId}`, payload);

        toast.success("Student updated successfully ✏️");

        setEditingId(null);
      } else {
        const res = await api.post("/students", payload);
        toast.success("Student added successfully 🎉");


      }
    

      setForm({
        name: "",
        rollNumber: "",
        rfid_uid: "",
        email: "",
        password: "",
      });

      setShowModal(false);

      await loadData(); // 🔥 wait for refresh
    } catch (err) {
      console.error("ERROR:", err.response?.data || err.message);
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;

    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted 🗑️");
      await loadData();
    } catch {
      toast.error("Failed to delete");    }
  };

  const handleEdit = (student) => {
    setForm({
      name: student.name,
      rollNumber: student.rollNumber,
      rfid_uid: student.rfid_uid,
      email: student.userId?.email || "",
      password: "",
    });

    setEditingId(student._id);
    setShowModal(true);
  };

  return (
    <main className="container">
      {/* STATS */}
      <div className="stats-row">
        <div className="ui-kpi kpi-purple">
          <p>Total</p>
          <h2>{students.length}</h2>
        </div>

        <div className="ui-kpi kpi-green">
          <p>High</p>
          <h2>{enrichedStudents.filter((s) => s.percentage > 75).length}</h2>
        </div>

        <div className="ui-kpi kpi-red">
          <p>Low</p>
          <h2>{enrichedStudents.filter((s) => s.percentage <= 40).length}</h2>
        </div>
      </div>

      {/* HEADER */}
      <div className="ui-card ui-card-filter toolbar">
        <div className="toolbar-left">
          <h3>
            Students <span>({processedStudents.length})</span>
          </h3>
        </div>

        <div className="toolbar-center">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="none">Sort</option>
            <option value="name">Name</option>
            <option value="percent">Attendance %</option>
          </select>

          <div className="search-box">
            <FiSearch className="search-icon" />

            <input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-right">
          {/* <button onClick={() => setShowModal(true)}></button> */}
          <button
            className="btn-primary"
            onClick={() => {
              setEditingId(null); // 🔥 reset edit mode
              setForm({
                name: "",
                rollNumber: "",
                rfid_uid: "",
                email: "",
                password: "",
              });
              setShowModal(true);
            }}
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        {loading ? (
          <p>Loading...</p>
        ) : paginatedStudents.length === 0 ? (
          <p className="empty-state">📭 No students found</p>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll</th>
                <th>RFID UID</th>
                <th>Email</th>
                <th>%</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedStudents.map((student) => {
                const percent = student.percentage;

                let color = "#dc2626";
                if (percent > 75) color = "#16a34a";
                else if (percent > 40) color = "#f59e0b";

                return (
                  <tr key={student._id}>
                    <td>{student.name}</td>
                    <td>{student.rollNumber}</td>
                    <td>{student.rfid_uid}</td>
                    <td>{student.userId?.email || "-"}</td>

                    <td>
                      <span>{percent}%</span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn edit"
                          onClick={() => handleEdit(student)}
                        >
                          <FiEdit />
                        </button>

                        <button
                          className="icon-btn delete"
                          onClick={() => handleDelete(student._id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* PAGINATION */}
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>

          <span>
            Page {currentPage} / {totalPages || 1}
          </span>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            {/* HEADER */}
            <div className="modal-header">
              <h3>{editingId ? "Edit Student" : "Add Student"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null); // 🔥 reset on close
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent}>
              {/* NAME */}
              <label>Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              {/* ROLL NUMBER */}
              <label>Roll Number</label>
              <input
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                disabled={!!editingId} // 🔥 only disable in edit
                placeholder={editingId ? "Cannot be changed" : ""}
                required
              />

              {/* RFID */}
              <label>RFID UID</label>
              <input
                name="rfid_uid"
                value={form.rfid_uid}
                onChange={handleChange}
                disabled={!!editingId}
                placeholder={editingId ? "Fixed after creation" : ""}
                required
              />

              {/* EMAIL */}
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={!!editingId}
                placeholder={editingId ? "Login ID cannot be changed" : ""}
                required
              />

              {/* PASSWORD */}
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={editingId ? "Leave blank to keep same" : ""}
                required={!editingId}
              />

              {/* INFO (ONLY EDIT MODE) */}
              {editingId && (
                <div className="info-box">
                  Only name and password can be updated
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? "Update Student" : "Add Student"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null); // 🔥 reset
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Students;
