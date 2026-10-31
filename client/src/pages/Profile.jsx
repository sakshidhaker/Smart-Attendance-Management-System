import { useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { validatePassword, validateProfile } from "../utils/validators";
import PageHeader from "../components/PageHeader";
import FormField from "../components/FormField";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [nameErrors, setNameErrors] = useState({});
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    const errs = validateProfile({ name });
    setNameErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const { data } = await api.put("/auth/me", { name: name.trim() });
      updateUser(data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(errorMessage(err, "Could not update"));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errs = validatePassword(pw);
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await api.put("/auth/me", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success("Password changed");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(errorMessage(err, "Could not change the password"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile & Settings" subtitle="Manage your details and password" />

      <div className="grid two">
        <div className="card">
          <h3>Account</h3>
          <div className="info">
            <div>
              <span className="muted">Email</span>
              <strong>{user.email}</strong>
            </div>
            <div>
              <span className="muted">Role</span>
              <strong className="cap">{user.role}</strong>
            </div>
            {user.rollNo && (
              <div>
                <span className="muted">Roll no</span>
                <strong>{user.rollNo}</strong>
              </div>
            )}
            {user.semester && (
              <div>
                <span className="muted">Semester</span>
                <strong>{user.semester}</strong>
              </div>
            )}
          </div>

          <form onSubmit={saveName} noValidate>
            <FormField label="Full name" error={nameErrors.name}>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <button className="btn primary" disabled={busy}>
              Save name
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Change password</h3>
          <form onSubmit={savePassword} noValidate>
            <FormField label="Current password" error={pwErrors.currentPassword}>
              <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </FormField>
            <FormField label="New password" error={pwErrors.newPassword} hint="At least 6 characters">
              <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </FormField>
            <FormField label="Confirm new password" error={pwErrors.confirm}>
              <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </FormField>
            <button className="btn primary" disabled={busy}>
              Change password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
