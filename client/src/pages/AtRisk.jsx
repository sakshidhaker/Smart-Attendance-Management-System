import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import FormField from "../components/FormField";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

const columns = [
  { key: "rollNo", header: "Roll No", render: (r) => r.student.rollNo },
  { key: "name", header: "Name", render: (r) => r.student.name },
  {
    key: "pct",
    header: "Attendance",
    render: (r) => (
      <>
        <strong>{r.percentage}%</strong> ({r.present}/{r.total})
      </>
    ),
  },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "need", header: "Need to attend", render: (r) => `${r.classesNeeded} lectures` },
];

export default function AtRisk() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/subjects")
      .then((res) => {
        setSubjects(res.data);
        if (res.data.length) setSubjectId(res.data[0]._id);
        else setLoading(false);
      })
      .catch((err) => {
        toast.error(errorMessage(err, "Could not load subjects"));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    api
      .get(`/attendance/at-risk?subject=${subjectId}`)
      .then((res) => setRows(res.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load data")))
      .finally(() => setLoading(false));
  }, [subjectId]);

  return (
    <div>
      <PageHeader title="At-Risk Students" subtitle="Students with attendance below 75%" />

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
      ) : subjects.length === 0 ? (
        <EmptyState title="No subjects" />
      ) : (
        <div className="card">
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.student.id} emptyTitle="All good!" emptyText="No student in this subject is below 75%." />
        </div>
      )}
    </div>
  );
}
