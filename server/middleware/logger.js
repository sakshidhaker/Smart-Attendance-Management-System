// Custom request logger: har request ka method, url, status aur time print karta hai
module.exports = (req, res, next) => {
  if (process.env.NODE_ENV === "test") return next();
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
};
