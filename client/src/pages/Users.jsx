import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import { validateUserForm } from "../utils/validators";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import FormField from "../components/FormField";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY = { name: "", email: "", password: "", role: "student", rollNo: "", semester: "" };

// Admin: Users ka poora CRUD (list, add, edit, delete)
export default function Users() {
  const searchRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (q.trim()) params.set("q", q.trim());
    api
      .get(`/users?${params.toString()}`)
      .then((res) => setUsers(res.data))
      .catch((err) => toast.error(errorMessage(err, "Users load nahi hue")))
      .finally(() => setLoading(false));
  }, [role, q]);

  // search type karte waqt har key pe API call na ho, isliye 300ms ruk ke
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditId(u._id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, rollNo: u.rollNo || "", semester: u.semester || "" });
    setErrors({});
    setModalOpen(true);
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const errs = validateUserForm(form, !!editId);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role };
    if (form.password) payload.password = form.password;
    if (form.role === "student") {
      payload.rollNo = form.rollNo.trim();
      payload.semester = Number(form.semester);
    }

    setBusy(true);
    try {
      if (editId) await api.put(`/users/${editId}`, payload);
      else await api.post("/users", { ...payload, password: form.password });
      toast.success(editId ? "User updated" : "User created");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Save nahi hua"));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/users/${deleting._id}`);
      toast.success("User deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Delete nahi hua"));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (u) => <span className="role-chip">{u.role}</span> },
    { key: "rollNo", header: "Roll No", render: (u) => u.rollNo || "-" },
    { key: "semester", header: "Sem", render: (u) => u.semester || "-" },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <div className="actions">
          <button className="btn small ghost" onClick={() => openEdit(u)}>
            Edit
          </button>
          <button className="btn small danger" onClick={() => setDeleting(u)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="Students, faculty aur admins manage karo">
        <button className="btn primary" onClick={openAdd}>
          + Add user
        </button>
      </PageHeader>

      <div className="card filters two">
        <FormField label="Search">
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email ya roll no" />
        </FormField>
        <FormField label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
        </FormField>
        {q && (
          <button
            className="btn ghost clear"
            onClick={() => {
              setQ("");
              searchRef.current?.focus();
            }}
          >
            Clear search
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <DataTable columns={columns} rows={users} emptyTitle="No users found" emptyText="Filter badal ke dekho ya naya user add karo." />
        </div>
      )}

      <Modal open={modalOpen} title={editId ? "Edit user" : "Add user"} onClose={() => setModalOpen(false)}>
        <form onSubmit={save} noValidate>
          <FormField label="Full name" error={errors.name}>
            <input name="name" value={form.name} onChange={change} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input name="email" type="email" value={form.email} onChange={change} />
          </FormField>
          <FormField label="Password" error={errors.password} hint={editId ? "Khaali chhodo to purana password rahega" : "At least 6 characters"}>
            <input name="password" type="password" value={form.password} onChange={change} />
          </FormField>
          <FormField label="Role">
            <select name="role" value={form.role} onChange={change}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
          {form.role === "student" && (
            <div className="two-col">
              <FormField label="Roll number" error={errors.rollNo}>
                <input name="rollNo" value={form.rollNo} onChange={change} />
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
          )}
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={() => setModalOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button className="btn primary" disabled={busy}>
              {busy ? "Saving..." : editId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleting}
        message={deleting ? `${deleting.name} (${deleting.email}) ko delete karna hai?` : ""}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
