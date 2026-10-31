// reusable wrapper: label + input + error message
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
