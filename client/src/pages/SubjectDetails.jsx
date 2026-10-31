import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

// /subjects/:id  ->  reads the id with useParams, then shows the subject and its students' attendance
export default function SubjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    Promise.all([api.get(`/subjects/${id}`), api.get(`/attendance/subject/${id}/summary`)])
      .then(([s, sum]) => {
        setSubject(s.data);
        setSummary(sum.data);
      })
      .catch((err) => {
        setFailed(true);
        toast.error(errorMessage(err, "Could not load the subject"));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (failed || !subject || !summary) {
    return (
      <EmptyState title="Subject not found" text="This subject was not found, or you do not have access to it.">
        <button className="btn primary" onClick={() => navigate(-1)}>
          Go back
        </button>
      </EmptyState>
    );
  }

  const atRisk = summary.students.filter((s) => s.total > 0 && s.percentage < 75).length;
  const classAvg = summary.students.length
    ? (summary.students.reduce((sum, s) => sum + s.percentage, 0) / summary.students.length).toFixed(1)
    : 0;

  const columns = [
    { key: "rollNo", header: "Roll No", render: (r) => r.student.rollNo },
    { key: "name", header: "Name", render: (r) => r.student.name },
    { key: "att", header: "Present / Total", render: (r) => `${r.present} / ${r.total}` },
    { key: "pct", header: "Attendance", render: (r) => <strong>{r.percentage}%</strong> },
    { key: "status", header: "Status", render: (r) => (r.total ? <StatusBadge status={r.status} /> : "-") },
    { key: "need", header: "Need to attend", render: (r) => (r.total && r.status !== "safe" ? `${r.classesNeeded} lectures` : "-") },
  ];

  return (
    <div>
      <PageHeader title={`${subject.code} - ${subject.name}`} subtitle={`Semester ${subject.semester} | Faculty: ${subject.faculty?.name || "-"}`}>
        <button className="btn ghost" onClick={() => navigate(-1)}>
          Back
        </button>
        <Link className="btn primary" to="/mark">
          Mark attendance
        </Link>
      </PageHeader>

      <div className="stat-grid">
        <StatCard label="Enrolled students" value={subject.students.length} tone="teal" />
        <StatCard label="Classes held" value={summary.totalClasses} tone="indigo" />
        <StatCard label="Class average" value={`${classAvg}%`} tone={classAvg >= 75 ? "safe" : "warning"} />
        <StatCard label="At-risk students" value={atRisk} tone={atRisk ? "danger" : "safe"} />
      </div>

      <h3 className="section">Students</h3>
      <div className="card">
        <DataTable columns={columns} rows={summary.students} rowKey={(r) => r.student.id} emptyTitle="No students enrolled" />
      </div>
    </div>
  );
}
