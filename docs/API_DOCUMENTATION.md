# AttendIQ - API Documentation

Base URL: `http://localhost:5000/api`
Format: JSON. Protected routes need the header `Authorization: Bearer <token>` (token comes from login).
Every error has the shape `{ "message": "..." }` (validation errors also carry an `errors` array).

## Common status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request (validation failed, invalid id, invalid input) |
| 401 | Not logged in, wrong credentials, or token invalid/expired |
| 403 | Logged in but this role is not allowed |
| 404 | Resource or route not found |
| 409 | Conflict (duplicate email, duplicate subject code, attendance already marked) |
| 413 | Request body too large (limit 10kb) |
| 429 | Too many login/register attempts (20 per 15 minutes) |
| 500 | Server error |

## 1. Auth  (`/api/auth`)

| Method | Endpoint | Access | Request body | Success response |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `{ name, email, password (min 6), rollNo?, semester? }` | `201` `{ token, user }` (role is always `student`) |
| POST | `/auth/login` | Public | `{ email, password }` | `200` `{ token, user }` |
| GET | `/auth/me` | Any logged in user | - | `200` user object |
| PUT | `/auth/me` | Any logged in user | `{ name? , currentPassword?, newPassword? }` | `200` updated user |

Login success (`200`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": { "id": "6ae2c8ab7b56e4e46a57f089", "name": "Student 1", "email": "student1@test.com", "role": "student", "rollNo": "CS5-001", "semester": 5 }
}
```
Wrong password (`401`): `{ "message": "Invalid email or password" }`
Validation failure (`400`):
```json
{ "message": "name must be at least 2 characters", "errors": ["name must be at least 2 characters", "email must be a valid email", "password must be at least 6 characters"] }
```
Duplicate email on register (`409`): `{ "message": "Email already registered" }`

## 2. Users  (`/api/users`)  - Admin only

| Method | Endpoint | Request body / query | Success response | Errors |
|---|---|---|---|---|
| GET | `/users?role=&semester=&q=` | query filters (`q` searches name, email, roll no) | `200` array of users | 401, 403 |
| GET | `/users/:id` | - | `200` user | 400 invalid id, 404 |
| POST | `/users` | `{ name, email, password, role?, rollNo?, semester? }` | `201` created user (no password) | 400, 409 |
| PUT | `/users/:id` | any of `name, email, password, role, rollNo, semester` | `200` updated user | 400, 404, 409 |
| DELETE | `/users/:id` | - | `200` `{ "message": "User deleted" }` | 400 (own account, or faculty who still has subjects), 404 |

`role` is one of `admin`, `faculty`, `student`. Deleting a student also removes them from every subject's enrolled list.

Create user (`201`):
```json
{ "name": "Demo Faculty", "email": "demo@test.com", "role": "faculty", "_id": "6ae2c8ac1fa2a30cf67680b2", "createdAt": "2026-10-29T04:16:44.739Z", "updatedAt": "2026-10-29T04:16:44.739Z" }
```

## 3. Subjects  (`/api/subjects`)

| Method | Endpoint | Access | Request body | Success response | Errors |
|---|---|---|---|---|---|
| GET | `/subjects` | Logged in | - | `200` array. Admin: all. Faculty: own. Student: enrolled (without student list) | 401 |
| GET | `/subjects/:id` | Admin, owner faculty, enrolled student | - | `200` subject with `faculty` and `students` populated | 400, 403, 404 |
| POST | `/subjects` | Admin | `{ name, code, semester, faculty, students? }` | `201` subject | 400, 409 (duplicate code) |
| PUT | `/subjects/:id` | Admin | any of `name, code, semester, faculty, students` | `200` subject | 400, 404, 409 |
| DELETE | `/subjects/:id` | Admin | - | `200` `{ "message": "Subject deleted" }` (its attendance is deleted too) | 400, 404 |

`faculty` must be a user with role `faculty`, and `students` must all have role `student` (else `400`).

Subject list item (`200`):
```json
{ "_id": "6ae2c8ab7b56e4e46a57f093", "name": "Data Structures", "code": "DS501", "semester": 5,
  "faculty": { "_id": "6ae2c8aa7b56e4e46a57f087", "name": "Dr. Sharma", "email": "faculty1@test.com" },
  "students": [ { "_id": "6ae2c8ab7b56e4e46a57f089", "name": "Student 1", "rollNo": "CS5-001", "semester": 5 } ] }
```

## 4. Attendance  (`/api/attendance`)

| Method | Endpoint | Access | Request body / query | Success response | Errors |
|---|---|---|---|---|---|
| POST | `/attendance` | Faculty (own subject), Admin | `{ subject, date, period (1-8), records: [{ student, status }] }` | `201` attendance sheet | 400, 403, 404, 409 |
| GET | `/attendance?subject=&date=` | Faculty, Admin | filters | `200` array (newest first, max 200) | 400, 403 |
| GET | `/attendance/:id` | Faculty (own), Admin | - | `200` sheet with students populated | 400, 403, 404 |
| PUT | `/attendance/:id` | Faculty (own), Admin | `{ records: [{ student, status }] }` | `200` updated sheet | 400, 403, 404 |
| DELETE | `/attendance/:id` | Faculty (own), Admin | - | `200` `{ "message": "Attendance deleted" }` | 403, 404 |
| GET | `/attendance/student/:id` | Student (own id only), Faculty, Admin | - | `200` `{ overall, subjects[] }` | 400, 403 |
| GET | `/attendance/subject/:subjectId/summary` | Faculty (own), Admin | - | `200` per-student percentages of that subject | 400, 403, 404 |
| GET | `/attendance/at-risk?subject=` | Faculty (own), Admin | - | `200` students below 75%, lowest first | 400, 403, 404 |

Rules enforced by the API: `status` is `present` or `absent`; every student in `records` must be enrolled in the subject and appear only once; the date cannot be in the future; the same subject + date + period cannot be marked twice (`409`).

Mark attendance request:
```json
{ "subject": "6ae2c8ab7b56e4e46a57f093", "date": "2026-08-10", "period": 2,
  "records": [ { "student": "6ae2c8ab7b56e4e46a57f089", "status": "present" }, { "student": "6ae2c8ab7b56e4e46a57f08a", "status": "absent" } ] }
```
Duplicate (`409`): `{ "message": "Attendance already marked for this subject, date and period" }`

Student stats (`200`) - includes the Bunk Planner values `safeBunks` and `classesNeeded`:
```json
{ "overall": { "present": 47, "total": 79, "percentage": 59.5, "status": "danger", "safeBunks": 0, "classesNeeded": 49 },
  "subjects": [ { "subjectId": "6ae2c8ab7b56e4e46a57f094", "name": "Database Systems", "code": "DB502", "present": 14, "total": 26, "percentage": 53.8, "status": "danger", "safeBunks": 0, "classesNeeded": 22 } ] }
```
At-risk list item (`200`):
```json
{ "student": { "id": "6ae2c8ab7b56e4e46a57f08c", "name": "Student 4", "rollNo": "CS5-004" }, "present": 12, "total": 26, "percentage": 46.2, "status": "danger", "safeBunks": 0, "classesNeeded": 30 }
```

## 5. Stats  (`/api/stats`)  - Faculty and Admin

| Method | Endpoint | Success response |
|---|---|---|
| GET | `/stats/overview` | `200` dashboard data built with MongoDB aggregation. Admin sees the whole college, faculty sees only own subjects |

```json
{ "totals": { "subjects": 3, "students": 10, "sheets": 79, "atRiskStudents": 6 },
  "overall": { "present": 565, "total": 782, "percentage": 72.3, "status": "warning" },
  "subjects": [ { "id": "6ae2c8ab7b56e4e46a57f093", "name": "Data Structures", "code": "DS501", "percentage": 70.2, "status": "warning" } ],
  "trend": [ { "date": "2026-09-29", "percentage": 66.7 }, { "date": "2026-09-30", "percentage": 76.7 } ],
  "usersByRole": { "student": 10, "faculty": 2, "admin": 1 } }
```

## 6. Error examples

| Situation | Status | Body |
|---|---|---|
| No token | 401 | `{ "message": "Token missing" }` |
| Student calls an admin route | 403 | `{ "message": "Access denied" }` |
| Malformed id in URL | 400 | `{ "message": "Invalid id" }` |
| Unknown record | 404 | `{ "message": "Attendance not found" }` |
| Unknown route | 404 | `{ "message": "Route not found: GET /api/nope" }` |
| Invalid JSON body | 400 | `{ "message": "Invalid JSON in request body" }` |

## 7. Bunk Planner values

With `p` = lectures attended and `t` = total lectures:
`percentage = p / t * 100`, `safeBunks = floor((4p - 3t) / 3)`, `classesNeeded = ceil(3t - 4p)` (0 when already at 75% or more).
`status` is `safe` (75% or more), `warning` (65% to 75%) or `danger` (below 65%).

A ready-to-import Postman collection with all these requests is in `docs/AttendIQ.postman_collection.json`.
