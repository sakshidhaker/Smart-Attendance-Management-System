// the password must never be sent in a response
module.exports = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  rollNo: u.rollNo,
  semester: u.semester,
});
