import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { setAuthToken } from "../api/client";

// 🔥 ICONS
import { FiRefreshCw, FiLogOut, FiUser } from "react-icons/fi";

const FacultyTopbar = ({ onRefresh }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setAuthToken(null);
    navigate("/login");
  };

  // 🔥 Dynamic Title
  const getTitle = () => {
    if (location.pathname.includes("students")) return "Students";
    if (location.pathname.includes("attendance")) return "Attendance";
    if (location.pathname.includes("analytics")) return "Analytics";
    return "Dashboard";
  };

  return (
    <header className="topbar">

      {/* LEFT */}
      <h2 className="page-title">{getTitle()}</h2>

      {/* RIGHT */}
      <div className="topbar-right">

        {/* ACTION GROUP */}
        <div className="topbar-actions">

          {/* 🔄 REFRESH */}
          {onRefresh && (
            <button className="icon-btn" onClick={onRefresh}>
              <FiRefreshCw size={16} />
            </button>
          )}

          {/* USER */}
          <div className="user-chip">
            <div className="avatar">
              {auth?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <span>
              <FiUser style={{ marginRight: "4px" }} />
              {auth?.user?.name}
            </span>
          </div>

        </div>

        {/* LOGOUT */}
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut style={{ marginRight: "6px" }} />
          Logout
        </button>

      </div>
    </header>
  );
};

export default FacultyTopbar;