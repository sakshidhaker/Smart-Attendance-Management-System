const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { validateBody, validateObjectId } = require("../middleware/validate");
const {
  listSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

const router = express.Router();

router.get("/", protect, listSubjects);
router.get("/:id", protect, validateObjectId("id"), getSubject);

router.post(
  "/",
  protect,
  authorize("admin"),
  validateBody({
    name: { required: true, type: "string", min: 2, max: 100 },
    code: { required: true, type: "string", min: 2, max: 20 },
    semester: { required: true, type: "integer", min: 1, max: 8 },
    faculty: { required: true, type: "objectId" },
    students: { type: "array" },
  }),
  createSubject
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  validateObjectId("id"),
  validateBody({
    name: { type: "string", min: 2, max: 100 },
    code: { type: "string", min: 2, max: 20 },
    semester: { type: "integer", min: 1, max: 8 },
    faculty: { type: "objectId" },
    students: { type: "array" },
  }),
  updateSubject
);

router.delete("/:id", protect, authorize("admin"), validateObjectId("id"), deleteSubject);

module.exports = router;
