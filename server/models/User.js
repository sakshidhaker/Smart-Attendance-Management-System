const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // unique index (login looks users up by email)
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["admin", "faculty", "student"], default: "student" },
    rollNo: { type: String, trim: true },
    semester: { type: Number, min: 1, max: 8 },
  },
  { timestamps: true }
);

// speeds up the admin list filters (role + semester)
userSchema.index({ role: 1, semester: 1 });

// hash the password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
