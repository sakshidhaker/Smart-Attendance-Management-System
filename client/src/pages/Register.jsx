import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";
import { homeFor } from "../utils/helpers";
import { validateRegister } from "../utils/validators";
import FormField from "../components/FormField";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", rollNo: "", semester: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRegister(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const u = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        rollNo: form.rollNo.trim(),
        semester: Number(form.semester),
      });
      toast.success("Account created!");
      navigate(homeFor(u.role));
    } catch (err) {
      toast.error(errorMessage(err, "Registration failed"));
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
        <p className="muted">Student registration</p>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Full name" error={errors.name}>
            <input name="name" value={form.name} onChange={change} placeholder="Your name" />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input name="email" type="email" value={form.email} onChange={change} placeholder="you@college.edu" />
          </FormField>
          <div className="two-col">
            <FormField label="Roll number" error={errors.rollNo}>
              <input name="rollNo" value={form.rollNo} onChange={change} placeholder="CS5-001" />
            </FormField>
            <FormField label="Semester" error={errors.semester}>
              <select name="semester" value={form.semester} onChange={change}>
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Password" error={errors.password} hint="At least 6 characters">
            <input name="password" type="password" value={form.password} onChange={change} />
          </FormField>
          <FormField label="Confirm password" error={errors.confirm}>
            <input name="confirm" type="password" value={form.confirm} onChange={change} />
          </FormField>
          <button className="btn primary full" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="center small">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
