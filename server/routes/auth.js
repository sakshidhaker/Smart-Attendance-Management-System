const express = require("express");
const { protect } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { register, login, getMe, updateMe } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  validateBody({
    name: { required: true, type: "string", min: 2, max: 60 },
    email: { required: true, type: "email" },
    password: { required: true, type: "string", min: 6, max: 100 },
    rollNo: { type: "string", max: 30 },
    semester: { type: "integer", min: 1, max: 8 },
  }),
  register
);

router.post(
  "/login",
  validateBody({
    email: { required: true, type: "string" },
    password: { required: true, type: "string" },
  }),
  login
);

router.get("/me", protect, getMe);

router.put(
  "/me",
  protect,
  validateBody({
    name: { type: "string", min: 2, max: 60 },
    currentPassword: { type: "string" },
    newPassword: { type: "string", min: 6, max: 100 },
  }),
  updateMe
);

module.exports = router;
