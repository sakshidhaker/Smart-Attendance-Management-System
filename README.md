# AttendIQ - Smart Attendance Management System

MERN Stack Lab project (Course ITUL503, Assignment-II). Faculty mark subject-wise and period-wise attendance, students track their attendance on a dashboard, and a built-in **Bunk Planner** tells a student how many lectures they can still miss while staying at 75%. Admins manage users and subjects.

**Stack:** React (Vite) | Node.js + Express | MongoDB Atlas + Mongoose | JWT authentication

---

## Features

**Authentication and roles**
- Register (students) and login with JWT, passwords hashed with bcrypt, token expires in 7 days
- Three roles (Admin, Faculty, Student). Pages are protected on the frontend and every API route is protected on the backend
- Profile page: change name and password

**Student**
- Dashboard with overall and subject-wise attendance, risk level (Safe, Warning, Danger) and a bar chart
- **Bunk Planner**: lectures that can still be missed, or lectures to attend in a row to get back to 75%

**Faculty**
- Dashboard with totals, subject-wise attendance, 30-day trend (MongoDB aggregation)
- Mark attendance (subject, date, period), duplicates are blocked
- Attendance history: edit or delete earlier sheets
- At-Risk list (below 75%), subject details page with every student's percentage

**Admin**
- Users: list, search, filter, add, edit, delete
- Subjects: add, edit, delete, assign faculty and enroll students
- Everything faculty can do, for all subjects

**Quality**
- Reusable components (Sidebar, Navbar, DataTable, Modal, StatCard, FormField, Loader, EmptyState, ...)
- Client-side form validation, loaders, empty states, toast notifications
- Backend: Express routers, controllers, custom middleware (request logger, validation, central error handler)
- Security: helmet, CORS, rate limiting, input type checks (NoSQL injection), `.env` for secrets
- Database optimization: indexes and aggregation pipelines
- Dark / Light mode

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Context API, axios, Recharts, react-hot-toast |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth and security | JWT, bcryptjs, helmet, express-rate-limit, cors, dotenv |
| Testing | Postman |

## Project structure

```
attendance-system_MERNPROJECT/
├── client/src/
│   ├── api.js                  axios instance (adds JWT to every request)
│   ├── App.jsx, main.jsx       routes and entry point
│   ├── index.css               theme (Midnight Indigo + Teal, dark mode)
│   ├── context/AuthContext.jsx login state shared across the app
│   ├── components/             Sidebar, Navbar, Layout, ProtectedRoute, DataTable,
│   │                           Modal, ConfirmModal, StatCard, StatusBadge, FormField,
│   │                           PageHeader, Loader, EmptyState
│   ├── pages/                  Login, Register, Dashboard, MyAttendance, MarkAttendance,
│   │                           AttendanceHistory, AtRisk, Users, Subjects,
│   │                           SubjectDetails, Profile, NotFound
│   └── utils/                  validators.js, helpers.js
├── server/
│   ├── app.js, server.js       express setup, and start (DB connect + listen)
│   ├── config/db.js            MongoDB connection
│   ├── models/                 User, Subject, Attendance (Mongoose schemas + indexes)
│   ├── controllers/            auth, user, subject, attendance, stats
│   ├── routes/                 express.Router files (auth, users, subjects, attendance, stats)
│   ├── middleware/             auth (JWT + roles), logger, validate, errorHandler
│   ├── utils/                  ApiError, asyncHandler, stats (Bunk Planner), formatUser
│   ├── seed.js                 sample data
│   └── .env.example
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md, er-diagram.png
│   └── AttendIQ.postman_collection.json
├── .gitignore
└── README.md
```

## Setup

### Prerequisites
Node.js 18 or later, a MongoDB Atlas cluster (or local MongoDB), Git.

### 1. Install

```bash
git clone  https://github.com/sakshidhaker/Smart-Attendance-Management-System.git
cd Smart-Attendance-Management-System


cd server
npm install

cd ../client
npm install
```

### 2. Environment variables

Create `server/.env` (copy `server/.env.example`):

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/attendance_db?retryWrites=true&w=majority
JWT_SECRET=<a long random string>
CLIENT_URL=http://localhost:5173
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
In Atlas, create a database user (password without special characters like `@ # / :`) and allow your IP under Network Access.
Optional: the frontend reads `VITE_API_URL` (default `http://localhost:5000/api`).

### 3. Sample data

```bash
cd server
npm run seed
```
Creates 1 admin, 2 faculty, 10 students, 3 subjects and about 78 attendance sheets. Running it again resets the data.

### 4. Run

```bash
# Terminal 1 - backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 - frontend (http://localhost:5173)
cd client
npm run dev
```
The backend prints `MongoDB connected` and `Server on port 5000`. Open `http://localhost:5173`.

## Sample logins (password `123456`)

| Role | Email |
|---|---|
| Admin | admin@test.com |
| Faculty | faculty1@test.com, faculty2@test.com |
| Student | student1@test.com ... student10@test.com |

Student 1 has the lowest attendance in the sample data, so the At-Risk list and Bunk Planner show interesting results.

## API

Full documentation with headers, request bodies and example JSON responses: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).
Import [`docs/AttendIQ.postman_collection.json`](docs/AttendIQ.postman_collection.json) into Postman (run a Login request first, the token is saved automatically).

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me` |
| Users (admin) | `GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id` |
| Subjects | `GET /subjects`, `GET /subjects/:id`, `POST /subjects`, `PUT /subjects/:id`, `DELETE /subjects/:id` |
| Attendance | `POST /attendance`, `GET /attendance`, `GET /attendance/:id`, `PUT /attendance/:id`, `DELETE /attendance/:id`, `GET /attendance/student/:id`, `GET /attendance/subject/:subjectId/summary`, `GET /attendance/at-risk` |
| Stats | `GET /stats/overview` |

## Database

Collections: `users`, `subjects`, `attendances`, linked with `ref` and `populate()`. Schema diagram and index list: [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md).

**Optimization:** unique compound index `(subject, date, period)` stops duplicate attendance; indexes on `records.student`, `date`, `faculty`, `students`, `role + semester`; aggregation pipelines (`$match`, `$unwind`, `$group`, `$lookup`) compute student percentages, the at-risk list and dashboard metrics.

## Bunk Planner

With `p` attended and `t` total lectures: percentage = `p / t * 100`; lectures that can still be missed = `floor((4p - 3t) / 3)`; lectures to attend in a row to reach 75% = `ceil(3t - 4p)`. Safe is 75% or more, Warning is 65% to 75%, Danger is below 65%.

## Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | `MONGO_URI` still points to local MongoDB. Use your Atlas string |
| `querySrv ECONNREFUSED` | DNS blocked on your network. Try a mobile hotspot (Google DNS is already set in `config/db.js`) |
| `bad auth` | Wrong Atlas username or password in `MONGO_URI` |
| CORS error in browser | `CLIENT_URL` in `server/.env` must match the frontend URL |
| `429 Too many attempts` | Rate limiter. Wait 15 minutes or restart the server |
| `401 Invalid or expired token` | Log in again |

## Author

Sakshi, B.Tech 3rd
 year, Swami Keshvanand Institute of Technology (SKIT), Jaipur.
