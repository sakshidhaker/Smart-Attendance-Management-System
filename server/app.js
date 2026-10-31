const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
// CLIENT_URL may hold more than one origin, separated by commas
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim()) }));
app.use(express.json({ limit: "10kb" }));
app.use(logger);

// at most 20 login/register attempts per 15 minutes (protection against brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts, try again after 15 minutes" },
  skip: () => process.env.NODE_ENV === "test",
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/subjects", require("./routes/subjects"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/stats", require("./routes/stats"));

app.get("/", (req, res) => res.send("API running"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
