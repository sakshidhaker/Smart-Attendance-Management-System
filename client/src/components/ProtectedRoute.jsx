import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/helpers";

// Bina login ya galat role wale ko page nahi dikhta
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
