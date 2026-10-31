import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";
import { homeFor } from "../utils/helpers";
import { validateLogin } from "../utils/validators";
import FormField from "../components/FormField";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // put the cursor in the email box as soon as the page opens
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateLogin(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
      navigate(homeFor(u.role));
    } catch (err) {
      toast.error(errorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand big">
          <span className="brand-dot" />
          AttendIQ
        </div>
        <p className="muted">Smart Attendance Management System</p>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Email" error={errors.email}>
            <input ref={emailRef} name="email" type="email" value={form.email} onChange={change} placeholder="you@college.edu" />
          </FormField>
          <FormField label="Password" error={errors.password}>
            <input name="password" type="password" value={form.password} onChange={change} placeholder="Enter password" />
          </FormField>
          <button className="btn primary full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="center small">
          New student? <Link to="/register">Create an account</Link>
        </p>
        <div className="demo">Demo: student1@test.com / faculty1@test.com / admin@test.com (password 123456)</div>
      </div>
    </div>
  );
}
