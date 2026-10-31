require("dotenv").config();
const connectDB = require("./config/db");

// JWT_SECRET ya MONGO_URI nahi hai to server start hi na ho
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error("Missing JWT_SECRET or MONGO_URI in .env");
  process.exit(1);
}

const app = require("./app");
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
