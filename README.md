# Resume Analyzer — Admin Panel

A login page plus a full Create / Read / Update / Delete interface for your
existing PostgreSQL "AI Resume Analyzer" database (the one you manage in
pgAdmin, with the `users`, `resumes`, `resume_analysis`, `job_descriptions`,
`skills`, and `job_skills` tables).

Stack: **Node.js + Express** for the server/API, **node-postgres (`pg`)** to
talk directly to your existing Postgres database, and a small vanilla
HTML/CSS/JS frontend (no build step needed).

## 1. Install dependencies

```bash
cd resume-crud-app
npm install
```

## 2. Point it at your database

Copy the example env file and fill in your real pgAdmin/Postgres connection
details:

```bash
cp .env.example .env
```

Edit `.env`:

```
PGHOST=localhost
PGPORT=5432
PGDATABASE=ai_resume_analyzer   # your actual database name
PGUSER=postgres                 # your actual Postgres username
PGPASSWORD=your_real_password
SESSION_SECRET=some_long_random_string
PORT=3000
```

You do **not** need to create any tables — this app assumes the 6 tables
already exist exactly as shown in your pgAdmin schema (`users`, `resumes`,
`resume_analysis`, `job_descriptions`, `skills`, `job_skills`).

> One thing to check in pgAdmin: your `users` table needs a `password_hash`
> column (text) for login to work, since the app never stores plain-text
> passwords. If that column is missing, add it once in pgAdmin:
> `ALTER TABLE users ADD COLUMN password_hash text;`

## 3. Run it

```bash
npm start
```

Then open **http://localhost:3000** — you'll land on the login page.

- **Create account** tab registers a new row in `users` (with a securely
  hashed password) and logs you in.
- **Sign in** tab logs in against an existing `users` row.
- Once logged in you're redirected to `/dashboard.html`, which has a sidebar
  for all 6 tables. Each table view lets you **add**, **edit**, and
  **delete** rows, backed by real SQL against your database.

## How it's wired together

```
public/            → frontend (login page + dashboard, plain HTML/CSS/JS)
routes/auth.js      → POST /api/auth/register, /login, /logout, GET /me
routes/users.js      → CRUD for the "users" table
routes/resumes.js       → CRUD for "resumes"
routes/resumeAnalysis.js → CRUD for "resume_analysis"
routes/jobDescriptions.js → CRUD for "job_descriptions"
routes/skills.js        → CRUD for "skills"
routes/jobSkills.js     → CRUD for "job_skills"
middleware/requireAuth.js → blocks all CRUD routes unless logged in
config/db.js         → the single pg Pool every route uses
server.js            → wires it all together + sessions
```

All CRUD routes require you to be logged in (session cookie). Passwords are
hashed with bcrypt and the `password_hash` column is never sent back to the
browser.

## Security notes before you deploy this anywhere public

- Change `SESSION_SECRET` in `.env` to a long random value.
- Put this behind HTTPS in production (cookies are set `httpOnly` but not
  `secure` by default, since local dev usually isn't HTTPS).
- Consider adding role-based checks (e.g. only admins can delete rows) if
  more than one person will log in.
