const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { validateBody, validateObjectId } = require("../middleware/validate");
const c = require("../controllers/attendanceController");

const router = express.Router();
router.use(protect);

const staff = authorize("faculty", "admin");

// note: fixed paths (/at-risk, /subject/..., /student/...) must always come before /:id
router.get("/at-risk", staff, c.atRisk);
router.get("/subject/:subjectId/summary", staff, validateObjectId("subjectId"), c.subjectSummary);
router.get("/student/:id", validateObjectId("id"), c.studentStats);

router.get("/", staff, c.listAttendance);
router.get("/:id", staff, validateObjectId("id"), c.getAttendance);

router.post(
  "/",
  staff,
  validateBody({
    subject: { required: true, type: "objectId" },
    date: { required: true, type: "date" },
    period: { required: true, type: "integer", min: 1, max: 8 },
    records: { required: true, type: "array", min: 1 },
  }),
  c.markAttendance
);

router.put(
  "/:id",
  staff,
  validateObjectId("id"),
  validateBody({ records: { required: true, type: "array", min: 1 } }),
  c.updateAttendance
);

router.delete("/:id", staff, validateObjectId("id"), c.deleteAttendance);

module.exports = router;
