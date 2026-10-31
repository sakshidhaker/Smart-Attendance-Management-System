import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/helpers";
import EmptyState from "../components/EmptyState";

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="login-wrap">
      <div className="login-card">
        <EmptyState title="404 - Page not found" text="This page does not exist.">
          <Link className="btn primary" to={user ? homeFor(user.role) : "/login"}>
            Go to home
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}
