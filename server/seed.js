require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Subject = require("./models/Subject");
const Attendance = require("./models/Attendance");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected, seeding...");

  await Promise.all([User.deleteMany(), Subject.deleteMany(), Attendance.deleteMany()]);

  await User.create({ name: "Admin", email: "admin@test.com", password: "123456", role: "admin" });

  const faculty = await User.create([
    { name: "Dr. Sharma", email: "faculty1@test.com", password: "123456", role: "faculty" },
    { name: "Prof. Verma", email: "faculty2@test.com", password: "123456", role: "faculty" },
  ]);

  const students = await User.create(
    Array.from({ length: 10 }, (_, i) => ({
      name: `Student ${i + 1}`,
      email: `student${i + 1}@test.com`,
      password: "123456",
      role: "student",
      rollNo: `CS5-${String(i + 1).padStart(3, "0")}`,
      semester: 5,
    }))
  );
  const studentIds = students.map((s) => s._id);

  const subjects = await Subject.create([
    { name: "Data Structures", code: "DS501", semester: 5, faculty: faculty[0]._id, students: studentIds },
    { name: "Database Systems", code: "DB502", semester: 5, faculty: faculty[0]._id, students: studentIds },
    { name: "Machine Learning", code: "ML503", semester: 5, faculty: faculty[1]._id, students: studentIds },
  ]);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const docs = [];

  for (let k = 1; k <= 30; k++) {
    const date = new Date(today.getTime() - k * 86400000);
    if (date.getUTCDay() === 0) continue; // Sunday chhutti

    subjects.forEach((sub, si) => {
      docs.push({
        subject: sub._id,
        date,
        period: si + 1,
        markedBy: sub.faculty,
        records: studentIds.map((id, i) => ({
          student: id,
          // Student 1 ka chance sabse kam, Student 10 ka sabse zyada
          status: Math.random() < 0.55 + i * 0.04 ? "present" : "absent",
        })),
      });
    });
  }

  await Attendance.insertMany(docs);
  // indexes ban chuke hain ya nahi, confirm
  await Promise.all([User.init(), Subject.init(), Attendance.init()]);

  console.log(`Done: ${students.length} students, ${subjects.length} subjects, ${docs.length} attendance sheets`);
  console.log("Logins -> admin@test.com | faculty1@test.com | student1@test.com (password: 123456)");
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
