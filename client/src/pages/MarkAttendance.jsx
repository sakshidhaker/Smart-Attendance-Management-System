import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import { todayStr } from "../utils/helpers";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import FormField from "../components/FormField";

export default function MarkAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [period, setPeriod] = useState(1);
  const [status, setStatus] = useState({}); // { studentId: "present" | "absent" }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/subjects")
      .then((res) => {
        setSubjects(res.data);
        if (res.data.length) setSubjectId(res.data[0]._id);
      })
      .catch((err) => toast.error(errorMessage(err, "Subjects load nahi hue")))
      .finally(() => setLoading(false));
  }, []);

  const subject = subjects.find((s) => s._id === subjectId);

  // subject badalte hi sab students ko default "present" kar do
  useEffect(() => {
    if (!subject) return;
    const init = {};
    subject.students.forEach((st) => (init[st._id] = "present"));
    setStatus(init);
  }, [subject]);

  const toggle = (id) => setStatus((s) => ({ ...s, [id]: s[id] === "present" ? "absent" : "present" }));
  const setAll = (value) => {
    const next = {};
    subject.students.forEach((st) => (next[st._id] = value));
    setStatus(next);
  };

  const presentCount = Object.values(status).filter((v) => v === "present").length;

  const submit = async () => {
    if (!date) return toast.error("Date select karo");
    setSaving(true);
    try {
      const records = subject.students.map((st) => ({ student: st._id, status: status[st._id] }));
      await api.post("/attendance", { subject: subjectId, date, period: Number(period), records });
      toast.success(`Attendance saved (${presentCount}/${records.length} present)`);
    } catch (err) {
      toast.error(errorMessage(err, "Save nahi hua"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (subjects.length === 0) return <EmptyState title="No subjects assigned" text="Admin se subject assign karwao." />;

  return (
    <div>
      <PageHeader title="Mark Attendance" subtitle="Subject, date aur period chun ke present/absent mark karo" />

      <div className="card filters">
        <FormField label="Subject">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label="Period">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
              <option key={p} value={p}>
                Period {p}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {subject && (
        <div className="card">
          <div className="row">
            <strong>
              {presentCount} / {subject.students.length} present
            </strong>
            <div className="actions">
              <button className="btn ghost" onClick={() => setAll("present")}>
                All present
              </button>
              <button className="btn ghost" onClick={() => setAll("absent")}>
                All absent
              </button>
            </div>
          </div>

          {subject.students.length === 0 ? (
            <EmptyState title="No students enrolled" text="Admin se is subject me students add karwao." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subject.students.map((st) => (
                    <tr key={st._id}>
                      <td>{st.rollNo}</td>
                      <td>{st.name}</td>
                      <td>
                        <button className={`pill ${status[st._id]}`} onClick={() => toggle(st._id)}>
                          {status[st._id] === "present" ? "Present" : "Absent"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button className="btn primary" onClick={submit} disabled={saving || subject.students.length === 0}>
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
