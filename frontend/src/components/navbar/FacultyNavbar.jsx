import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { setAuthToken } from "../../api/client";

// 🔥 React Icons
import { FiRefreshCw, FiLogOut, FiUser } from "react-icons/fi";

const FacultyNavbar = ({ onRefresh }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setAuthToken(null);
    navigate("/login");
  };

  const getTitle = () => {
    if (location.pathname.includes("students")) return "Students";
    if (location.pathname.includes("attendance")) return "Attendance";
    if (location.pathname.includes("analytics")) return "Analytics";
    return "Dashboard";
  };

  return (
    <div className="admin-navbar">

      {/* LEFT */}
      <h2 className="page-title">{getTitle()}</h2>

      {/* RIGHT */}
      <div className="nav-actions">

        {/* 🔥 ACTION GROUP */}
        <div className="nav-actions-group">

          {/* REFRESH */}
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
              <FiUser className="icon" />
              {auth?.user?.name}
            </span>
          </div>

        </div>

        {/* LOGOUT */}
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut className="icon" />
          Logout
        </button>

      </div>
    </div>
  );
};

export default FacultyNavbar;