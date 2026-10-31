const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { validateBody, validateObjectId } = require("../middleware/validate");
const { listUsers, getUser, createUser, updateUser, deleteUser } = require("../controllers/userController");

const router = express.Router();
router.use(protect, authorize("admin"));

const roles = ["admin", "faculty", "student"];

router.get("/", listUsers);
router.get("/:id", validateObjectId("id"), getUser);

router.post(
  "/",
  validateBody({
    name: { required: true, type: "string", min: 2, max: 60 },
    email: { required: true, type: "email" },
    password: { required: true, type: "string", min: 6, max: 100 },
    role: { type: "string", oneOf: roles },
    rollNo: { type: "string", max: 30 },
    semester: { type: "integer", min: 1, max: 8 },
  }),
  createUser
);

router.put(
  "/:id",
  validateObjectId("id"),
  validateBody({
    name: { type: "string", min: 2, max: 60 },
    email: { type: "email" },
    password: { type: "string", min: 6, max: 100 },
    role: { type: "string", oneOf: roles },
    rollNo: { type: "string", max: 30 },
    semester: { type: "integer", min: 1, max: 8 },
  }),
  updateUser
);

router.delete("/:id", validateObjectId("id"), deleteUser);

module.exports = router;
