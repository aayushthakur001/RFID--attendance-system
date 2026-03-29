import { NavLink, Outlet } from "react-router-dom";
import FacultyNavbar from "./navbar/FacultyNavbar";

const FacultyLayout = () => {
  return (
    <div className="layout">

      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">

        {/* LOGO */}
        <div className="logo">RFID</div>

        {/* NAVIGATION */}
        <nav className="sidebar-nav">

          <NavLink
            to="/faculty/dashboard"
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span>📊</span> Dashboard
          </NavLink>

          <NavLink
            to="/faculty/students"
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span>👥</span> Students
          </NavLink>

          <NavLink
            to="/faculty/attendance"
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span>📅</span> Attendance
          </NavLink>

          <NavLink
            to="/faculty/analytics"
            className={({ isActive }) => isActive ? "active" : ""}
          >
            <span>📈</span> Analytics
          </NavLink>

        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-content">

        {/* TOPBAR */}
        <FacultyNavbar />

        {/* PAGE CONTENT */}
        <div className="page-content">
          <Outlet />
        </div>

      </div>

    </div>
  );
};

export default FacultyLayout;