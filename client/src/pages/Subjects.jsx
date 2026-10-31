import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { validateSubjectForm } from "../utils/validators";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import FormField from "../components/FormField";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY = { name: "", code: "", semester: "", faculty: "", students: [] };

// Admin: Subjects ka CRUD. Faculty: sirf apne subjects dekh sakti hai
export default function Subjects() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/subjects")
      .then((res) => setSubjects(res.data))
      .catch((err) => toast.error(errorMessage(err, "Subjects load nahi hue")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    if (isAdmin) {
      api.get("/users?role=faculty").then((res) => setFacultyList(res.data)).catch(() => {});
      api.get("/users?role=student").then((res) => setStudentList(res.data)).catch(() => {});
    }
  }, [load, isAdmin]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditId(s._id);
    setForm({
      name: s.name,
      code: s.code,
      semester: s.semester,
      faculty: s.faculty?._id || "",
      students: (s.students || []).map((st) => st._id),
    });
    setErrors({});
    setModalOpen(true);
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleStudent = (id) =>
    setForm((f) => ({ ...f, students: f.students.includes(id) ? f.students.filter((x) => x !== id) : [...f.students, id] }));

  // form me chuni hui semester ke saare students ek click me
  const selectSemester = () => {
    if (!form.semester) return toast.error("Pehle semester select karo");
    const ids = studentList.filter((st) => st.semester === Number(form.semester)).map((st) => st._id);
    setForm((f) => ({ ...f, students: [...new Set([...f.students, ...ids])] }));
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = validateSubjectForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      semester: Number(form.semester),
      faculty: form.faculty,
      students: form.students,
    };

    setBusy(true);
    try {
      if (editId) await api.put(`/subjects/${editId}`, payload);
      else await api.post("/subjects", payload);
      toast.success(editId ? "Subject updated" : "Subject created");
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
      await api.delete(`/subjects/${deleting._id}`);
      toast.success("Subject deleted");
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Delete nahi hua"));
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  };

  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Subject", render: (s) => <Link to={`/subjects/${s._id}`}>{s.name}</Link> },
    { key: "semester", header: "Sem" },
    { key: "faculty", header: "Faculty", render: (s) => s.faculty?.name || "-" },
    { key: "students", header: "Students", render: (s) => s.students?.length ?? 0 },
    {
      key: "actions",
      header: "Actions",
      render: (s) => (
        <div className="actions">
          <Link className="btn small ghost" to={`/subjects/${s._id}`}>
            Details
          </Link>
          {isAdmin && (
            <>
              <button className="btn small ghost" onClick={() => openEdit(s)}>
                Edit
              </button>
              <button className="btn small danger" onClick={() => setDeleting(s)}>
                Delete
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={isAdmin ? "Subjects" : "My Subjects"} subtitle={isAdmin ? "Subjects, faculty aur enrolled students manage karo" : "Aapko assign kiye gaye subjects"}>
        {isAdmin && (
          <button className="btn primary" onClick={openAdd}>
            + Add subject
          </button>
        )}
      </PageHeader>

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <DataTable columns={columns} rows={subjects} emptyTitle="No subjects" emptyText={isAdmin ? "Naya subject add karo." : "Abhi koi subject assign nahi hua."} />
        </div>
      )}

      <Modal open={modalOpen} title={editId ? "Edit subject" : "Add subject"} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={save} noValidate>
          <div className="two-col">
            <FormField label="Subject name" error={errors.name}>
              <input name="name" value={form.name} onChange={change} placeholder="Data Structures" />
            </FormField>
            <FormField label="Subject code" error={errors.code}>
              <input name="code" value={form.code} onChange={change} placeholder="DS501" />
            </FormField>
          </div>
          <div className="two-col">
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
            <FormField label="Faculty" error={errors.faculty}>
              <select name="faculty" value={form.faculty} onChange={change}>
                <option value="">Select faculty</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="row">
            <label className="plain-label">Enrolled students ({form.students.length})</label>
            <div className="actions">
              <button type="button" className="btn small ghost" onClick={selectSemester}>
                Select semester
              </button>
              <button type="button" className="btn small ghost" onClick={() => setForm({ ...form, students: [] })}>
                Clear
              </button>
            </div>
          </div>
          <div className="checklist">
            {studentList.length === 0 && <span className="muted small">Koi student nahi mila</span>}
            {studentList.map((st) => (
              <label key={st._id} className="check">
                <input type="checkbox" checked={form.students.includes(st._id)} onChange={() => toggleStudent(st._id)} />
                <span>
                  {st.rollNo || "-"} | {st.name} {st.semester ? `(Sem ${st.semester})` : ""}
                </span>
              </label>
            ))}
          </div>

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
        message={deleting ? `${deleting.code} - ${deleting.name} delete hone par uski saari attendance bhi delete ho jayegi.` : ""}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
