import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import { formatDate } from "../utils/helpers";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import FormField from "../components/FormField";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

// Purani attendance sheets dekho, edit (PUT) ya delete (DELETE) karo
export default function AttendanceHistory() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id, label, rows: [{ student, status }] }
  const [deleting, setDeleting] = useState(null); // sheet
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/subjects")
      .then((res) => {
        setSubjects(res.data);
        if (res.data.length) setSubjectId(res.data[0]._id);
        else setLoading(false);
      })
      .catch((err) => {
        toast.error(errorMessage(err, "Subjects load nahi hue"));
        setLoading(false);
      });
  }, []);

  const loadSheets = useCallback(() => {
    if (!subjectId) return;
    setLoading(true);
    api
      .get(`/attendance?subject=${subjectId}`)
      .then((res) => setSheets(res.data))
      .catch((err) => toast.error(errorMessage(err, "History load nahi hui")))
      .finally(() => setLoading(false));
  }, [subjectId]);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  const openEdit = (sheet) =>
    setEditing({
      id: sheet._id,
      label: `${sheet.subject.code} | ${formatDate(sheet.date)} | Period ${sheet.period}`,
      rows: sheet.records.map((r) => ({ student: r.student, status: r.status })),
    });

  const toggleRow = (i) =>
    setEditing((ed) => ({
      ...ed,
      rows: ed.rows.map((r, idx) => (idx === i ? { ...r, status: r.status === "present" ? "absent" : "present" } : r)),
    }));

  const saveEdit = async () => {
    setBusy(true);
    try {
      await api.put(`/attendance/${editing.id}`, { records: editing.rows.map((r) => ({ student: r.student._id, status: r.status })) });
      toast.success("Attendance updated");
      setEditing(null);
      loadSheets();
    } catch (err) {
      toast.error(errorMessage(err, "Update nahi hua"));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/attendance/${deleting._id}`);
      toast.success("Attendance deleted");
      setDeleting(null);
      loadSheets();
    } catch (err) {
      toast.error(errorMessage(err, "Delete nahi hua"));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "date", header: "Date", render: (s) => formatDate(s.date) },
    { key: "period", header: "Period" },
    {
      key: "present",
      header: "Present",
      render: (s) => `${s.records.filter((r) => r.status === "present").length} / ${s.records.length}`,
    },
    {
      key: "actions",
      header: "Actions",
      render: (s) => (
        <div className="actions">
          <button className="btn small ghost" onClick={() => openEdit(s)}>
            Edit
          </button>
          <button className="btn small danger" onClick={() => setDeleting(s)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Attendance History" subtitle="Pehle mark ki gayi attendance ko edit ya delete karo" />

      {subjects.length > 0 && (
        <div className="card filters one">
          <FormField label="Subject">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <DataTable columns={columns} rows={sheets} emptyTitle="No attendance sheets" emptyText="Is subject ki abhi koi attendance mark nahi hui." />
        </div>
      )}

      <Modal open={!!editing} title="Edit attendance" onClose={() => setEditing(null)}>
        {editing && (
          <>
            <p className="muted">{editing.label}</p>
            <div className="table-wrap short">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {editing.rows.map((r, i) => (
                    <tr key={r.student._id}>
                      <td>{r.student.rollNo}</td>
                      <td>{r.student.name}</td>
                      <td>
                        <button className={`pill ${r.status}`} onClick={() => toggleRow(i)}>
                          {r.status === "present" ? "Present" : "Absent"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setEditing(null)} disabled={busy}>
                Cancel
              </button>
              <button className="btn primary" onClick={saveEdit} disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleting}
        message={deleting ? `${deleting.subject.code} ki ${formatDate(deleting.date)} (Period ${deleting.period}) ki attendance delete ho jayegi.` : ""}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {!loading && subjects.length === 0 && <EmptyState title="No subjects" />}
    </div>
  );
}
