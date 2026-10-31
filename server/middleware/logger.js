// Custom request logger: prints method, URL, status and time of every request
module.exports = (req, res, next) => {
  if (process.env.NODE_ENV === "test") return next();
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
};
