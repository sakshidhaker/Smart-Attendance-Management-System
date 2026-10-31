export default function EmptyState({ title = "Nothing here yet", text, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">:)</div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  );
}
