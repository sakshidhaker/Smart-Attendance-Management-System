import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { STATUS_COLORS } from "../utils/helpers";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

// Admin + Faculty dashboard (data MongoDB aggregation se aata hai)
export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/stats/overview")
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errorMessage(err, "Dashboard load nahi hua")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data) return <EmptyState title="Dashboard unavailable" text="Server se data nahi aa paaya." />;

  const { totals, overall, subjects, trend, usersByRole } = data;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={user.role === "admin" ? "Poore college ka overview" : "Aapke subjects ka overview"}>
        <Link className="btn primary" to="/mark">
          Mark Attendance
        </Link>
      </PageHeader>

      <div className="stat-grid">
        <StatCard label="Overall attendance" value={`${overall.percentage}%`} tone={overall.status === "safe" ? "safe" : overall.status} hint={`${overall.present} / ${overall.total} records`} />
        <StatCard label="Subjects" value={totals.subjects} tone="indigo" />
        <StatCard label="Students" value={totals.students} tone="teal" hint={usersByRole ? `${usersByRole.faculty || 0} faculty, ${usersByRole.admin || 0} admin` : undefined} />
        <StatCard label="Attendance sheets" value={totals.sheets} tone="indigo" />
        <StatCard label="At-risk students" value={totals.atRiskStudents} tone={totals.atRiskStudents ? "danger" : "safe"} hint="Below 75% overall" />
      </div>

      <h3 className="section">Subject-wise attendance</h3>
      <div className="card" style={{ height: 300 }}>
        {subjects.length === 0 ? (
          <EmptyState title="No subjects yet" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjects}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="code" stroke="var(--muted)" />
              <YAxis domain={[0, 100]} stroke="var(--muted)" />
              <Tooltip />
              <ReferenceLine y={75} stroke="#14B8A6" strokeDasharray="4 4" label={{ value: "75%", fill: "#14B8A6" }} />
              <Bar dataKey="percentage" name="Attendance %" radius={[8, 8, 0, 0]}>
                {subjects.map((s) => (
                  <Cell key={s.id} fill={STATUS_COLORS[s.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <h3 className="section">Last 30 days trend</h3>
      <div className="card" style={{ height: 280 }}>
        {trend.length === 0 ? (
          <EmptyState title="No recent attendance" text="Pichle 30 din me koi attendance mark nahi hui." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" stroke="var(--muted)" tickFormatter={(d) => d.slice(5)} />
              <YAxis domain={[0, 100]} stroke="var(--muted)" />
              <Tooltip />
              <Line type="monotone" dataKey="percentage" name="Attendance %" stroke="#312E81" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
