const LABEL = { safe: "Safe", warning: "Warning", danger: "Danger" };

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{LABEL[status] || status}</span>;
}
