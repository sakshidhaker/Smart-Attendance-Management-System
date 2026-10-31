// first page for each role
export const homeFor = (role) => (role === "student" ? "/my-attendance" : "/dashboard");

// dates are stored at UTC midnight in the database, so they are shown in UTC as well
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const STATUS_COLORS = { safe: "#10B981", warning: "#F59E0B", danger: "#F43F5E" };
