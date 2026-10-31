// label + input + error message ka reusable wrapper
export default function FormField({ label, error, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
