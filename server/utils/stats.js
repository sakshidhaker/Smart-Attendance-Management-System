// present = lectures attended, total = all lectures held
exports.calcStats = (present, total) => {
  const percentage = total ? +((present / total) * 100).toFixed(1) : 0;

  // how many more lectures can be missed while staying at 75%
  const safeBunks = Math.max(0, Math.floor((4 * present - 3 * total) / 3));

  // how many lectures must be attended in a row to get back to 75%
  const classesNeeded = percentage >= 75 ? 0 : Math.ceil(3 * total - 4 * present);

  const status = percentage >= 75 ? "safe" : percentage >= 65 ? "warning" : "danger";

  return { present, total, percentage, status, safeBunks, classesNeeded };
};
