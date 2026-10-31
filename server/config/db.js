// Kuch networks pe SRV DNS lookup fail hota hai, isliye Google DNS set kiya hai
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB error:", err.message);
    process.exit(1);
  }
};
