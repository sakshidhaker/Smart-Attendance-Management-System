// password kabhi response me nahi jaana chahiye
module.exports = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  rollNo: u.rollNo,
  semester: u.semester,
});
