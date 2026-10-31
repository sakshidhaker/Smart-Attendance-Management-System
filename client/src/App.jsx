import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { homeFor } from "./utils/helpers";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyAttendance from "./pages/MyAttendance";
import MarkAttendance from "./pages/MarkAttendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import AtRisk from "./pages/AtRisk";
import Users from "./pages/Users";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const STAFF = ["faculty", "admin"];

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Login ke baad ke saare pages Layout (sidebar + navbar) ke andar */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/my-attendance" element={<ProtectedRoute roles={["student"]}><MyAttendance /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute roles={STAFF}><Dashboard /></ProtectedRoute>} />
          <Route path="/mark" element={<ProtectedRoute roles={STAFF}><MarkAttendance /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute roles={STAFF}><AttendanceHistory /></ProtectedRoute>} />
          <Route path="/at-risk" element={<ProtectedRoute roles={STAFF}><AtRisk /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute roles={STAFF}><Subjects /></ProtectedRoute>} />
          <Route path="/subjects/:id" element={<ProtectedRoute roles={STAFF}><SubjectDetails /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
