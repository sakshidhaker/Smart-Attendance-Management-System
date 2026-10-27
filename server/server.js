require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// JWT_SECRET ya MONGO_URI nahi hai to server start hi na ho
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error("Missing JWT_SECRET or MONGO_URI in .env");
  process.exit(1);
}

const app = express();
connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

// login/register pe 15 min me 20 try se zyada nahi
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts, try again after 15 minutes" },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/subjects", require("./routes/subjects"));
app.use("/api/attendance", require("./routes/attendance"));

app.get("/", (req, res) => res.send("API running"));

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));