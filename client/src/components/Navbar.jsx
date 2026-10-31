import { Link } from "react-router-dom";

export default function Navbar({ user, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <h2 className="greet">Hello, {user.name.split(" ")[0]}</h2>
      <div className="actions">
        <Link className="btn ghost" to="/profile">
          Profile
        </Link>
        <button className="btn ghost" onClick={onToggleTheme}>
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </div>
    </header>
  );
}
