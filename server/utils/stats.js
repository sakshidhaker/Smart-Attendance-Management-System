// present = attend kiye lectures, total = kul lectures
exports.calcStats = (present, total) => {
  const percentage = total ? +((present / total) * 100).toFixed(1) : 0;

  // 75% rakhte hue kitne lecture aur miss kar sakte hain
  const safeBunks = Math.max(0, Math.floor((4 * present - 3 * total) / 3));

  // 75% wapas pane ke liye lagatar kitne lecture attend karne honge
  const classesNeeded = percentage >= 75 ? 0 : Math.ceil(3 * total - 4 * present);

  const status = percentage >= 75 ? "safe" : percentage >= 65 ? "warning" : "danger";

  return { present, total, percentage, status, safeBunks, classesNeeded };
};