import { NavLink } from "react-router-dom";

const NAV = {
  student: [
    { to: "/my-attendance", label: "My Attendance" },
    { to: "/profile", label: "Profile" },
  ],
  faculty: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/mark", label: "Mark Attendance" },
    { to: "/history", label: "Attendance History" },
    { to: "/at-risk", label: "At-Risk Students" },
    { to: "/subjects", label: "My Subjects" },
    { to: "/profile", label: "Profile" },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/users", label: "Users" },
    { to: "/subjects", label: "Subjects" },
    { to: "/mark", label: "Mark Attendance" },
    { to: "/history", label: "Attendance History" },
    { to: "/at-risk", label: "At-Risk Students" },
    { to: "/profile", label: "Profile" },
  ],
};

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-dot" />
        AttendIQ
      </div>
      <nav>
        {(NAV[user.role] || []).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav active" : "nav")}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="side-foot">
        <div className="who">
          <strong>{user.name}</strong>
          <span className="role-tag">{user.role}</span>
        </div>
        <button className="btn ghost" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
