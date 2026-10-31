// Client-side form validation. Har function { field: "error message" } object deta hai (khaali = sab theek)

export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v || "");

export function validateLogin({ email, password }) {
  const e = {};
  if (!email.trim()) e.email = "Email is required";
  else if (!isEmail(email.trim())) e.email = "Enter a valid email";
  if (!password) e.password = "Password is required";
  return e;
}

export function validateRegister({ name, email, password, confirm, rollNo, semester }) {
  const e = {};
  if (name.trim().length < 2) e.name = "Name must be at least 2 characters";
  if (!isEmail(email.trim())) e.email = "Enter a valid email";
  if (!rollNo.trim()) e.rollNo = "Roll number is required";
  if (!semester) e.semester = "Select your semester";
  if (password.length < 6) e.password = "Password must be at least 6 characters";
  if (confirm !== password) e.confirm = "Passwords do not match";
  return e;
}

export function validateUserForm({ name, email, password, role, rollNo, semester }, isEdit) {
  const e = {};
  if (name.trim().length < 2) e.name = "Name must be at least 2 characters";
  if (!isEmail(email.trim())) e.email = "Enter a valid email";
  if (!isEdit && password.length < 6) e.password = "Password must be at least 6 characters";
  if (isEdit && password && password.length < 6) e.password = "Password must be at least 6 characters";
  if (role === "student") {
    if (!rollNo.trim()) e.rollNo = "Roll number is required for students";
    if (!semester) e.semester = "Select a semester";
  }
  return e;
}

export function validateSubjectForm({ name, code, semester, faculty }) {
  const e = {};
  if (name.trim().length < 2) e.name = "Subject name is required";
  if (code.trim().length < 2) e.code = "Subject code is required";
  if (!semester) e.semester = "Select a semester";
  if (!faculty) e.faculty = "Select a faculty";
  return e;
}

export function validateProfile({ name }) {
  const e = {};
  if (name.trim().length < 2) e.name = "Name must be at least 2 characters";
  return e;
}

export function validatePassword({ currentPassword, newPassword, confirm }) {
  const e = {};
  if (!currentPassword) e.currentPassword = "Enter your current password";
  if (newPassword.length < 6) e.newPassword = "New password must be at least 6 characters";
  if (confirm !== newPassword) e.confirm = "Passwords do not match";
  return e;
}
