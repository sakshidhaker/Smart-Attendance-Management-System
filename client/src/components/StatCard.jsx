// Dashboard ke number cards. tone: indigo | teal | safe | warning | danger
export default function StatCard({ label, value, hint, tone = "indigo" }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
