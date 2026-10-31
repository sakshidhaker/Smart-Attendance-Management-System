import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="shell">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="main">
        <Navbar user={user} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
