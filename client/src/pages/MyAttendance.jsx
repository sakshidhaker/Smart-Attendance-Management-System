import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { STATUS_COLORS } from "../utils/helpers";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

// Bunk Planner message
function planner(s) {
  if (s.total === 0) return "No class has been marked yet";
  if (s.status === "safe") {
    return s.safeBunks > 0
      ? `You can still miss ${s.safeBunks} more lecture${s.safeBunks === 1 ? "" : "s"} and stay at 75% or above`
      : "You are right at 75%, do not miss any more lectures";
  }
  return `Attend the next ${s.classesNeeded} lecture${s.classesNeeded === 1 ? "" : "s"} in a row to get back to 75%`;
}

export default function MyAttendance() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/attendance/student/${user.id}`)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load attendance")))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <Loader />;
  if (!data || data.subjects.length === 0) {
    return <EmptyState title="No attendance yet" text="No attendance has been recorded for you yet." />;
  }

  const { overall, subjects } = data;
  const chartData = subjects.map((s) => ({ name: s.code, percentage: s.percentage, status: s.status }));

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Subject-wise percentage and Bunk Planner" />

      <div className="card hero" style={{ borderLeft: `6px solid ${STATUS_COLORS[overall.status]}` }}>
        <div>
          <div className="muted">Overall attendance</div>
          <div className="big-num">{overall.percentage}%</div>
          <StatusBadge status={overall.status} />
        </div>
        <div className="hero-note">
          {overall.present} / {overall.total} lectures attended
          <div className="planner">{planner(overall)}</div>
        </div>
      </div>

      <h3 className="section">Subject-wise</h3>
      <div className="grid">
        {subjects.map((s) => (
          <div className="card" key={s.subjectId}>
            <div className="row">
              <strong>{s.name}</strong>
              <StatusBadge status={s.status} />
            </div>
            <div className="muted small">{s.code}</div>
            <div className="num">{s.percentage}%</div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.min(s.percentage, 100)}%`, background: STATUS_COLORS[s.status] }} />
              <div className="bar-mark" />
            </div>
            <div className="muted small">
              {s.present} / {s.total} lectures
            </div>
            <div className="planner">{planner(s)}</div>
          </div>
        ))}
      </div>

      <h3 className="section">Chart</h3>
      <div className="card" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="name" stroke="var(--muted)" />
            <YAxis domain={[0, 100]} stroke="var(--muted)" />
            <Tooltip />
            <ReferenceLine y={75} stroke="#14B8A6" strokeDasharray="4 4" label={{ value: "75%", fill: "#14B8A6" }} />
            <Bar dataKey="percentage" name="Attendance %" radius={[8, 8, 0, 0]}>
              {chartData.map((d) => (
                <Cell key={d.name} fill={STATUS_COLORS[d.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
