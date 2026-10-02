# Mindful Canvas - Backend API

This is the backend API server for the Mindful Canvas Note App, built with Node.js, Express, and Supabase PostgreSQL. It manages user synchronization from Supabase Auth, handles note-taking CRUD operations (including soft deleting to a trash bin and permanent deletion), and includes an automatic **Keep-Alive worker** to prevent Supabase free tier inactivity auto-pausing.

---

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database**: [Supabase PostgreSQL](https://supabase.com/) (accessed via `pg` driver with SSL)
- **Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **CORS**: Enabled with credential support, dynamic origin matching the frontend

---

## Project Structure

```
backend/
├── index.js             # Main server logic, API routes, and Keep-Alive worker
├── package.json         # Node dependencies and scripts
├── .env                 # Local environment variables (git-ignored)
├── .env.example         # Template for environment variables
├── schema.sql           # Database schema for users table
└── notes_table.sql      # Database schema for notes table
```

---

## Getting Started

### 1. Prerequisites
- Node.js installed (v16+)
- A Supabase project ([supabase.com](https://supabase.com))

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the `.env` file with your config:
- `PORT`: Port the server runs on (defaults to `3001`).
- `DATABASE_URL`: Your Supabase PostgreSQL connection string URI.
  - Recommended: Supabase Connection Pooler (`aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`).
  - Or Direct Connection (`db.[project-ref].supabase.co:5432/postgres?sslmode=require`).
- `KEEP_ALIVE_INTERVAL_HOURS`: Interval in hours between automated database pings (default `48` hours / every 2 days).
- `FRONTEND_URL`: URL of the frontend (e.g. `http://localhost:5173`).
- `SUPABASE_JWT_SECRET`: Secret key used if verifying JWTs from Supabase.

### 3. Installation
Install the dependencies from the `backend` folder:
```bash
npm install
```

### 4. Running the Server

#### Development Mode (with hot-reloading)
Runs node with `nodemon` to automatically restart on changes:
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

---

## Database Initialization
The server automatically executes table initialization upon startup:
- **`users` Table**: Stores synchronized user profiles (ID from Supabase Auth UID, Email, Name, Avatar URL).
- **`notes` Table**: Stores notes linked to users, supporting soft delete status (`is_trash`), creation, and update timestamps.

You can also run `schema.sql` and `notes_table.sql` manually in the **Supabase Dashboard -> SQL Editor**.

---

## Keep-Alive Background Worker
Supabase free tier automatically pauses inactive projects after 7 days without activity.
This backend features an automated keep-alive background worker:
- **Scheduled Ping**: Automatically queries the database every 48 hours (`SELECT NOW() as current_time, COUNT(*)::int as note_count FROM notes;`).
- **Initial Startup Ping**: Tests database connectivity as soon as the server boots up.
- **Keep-Alive Endpoint**: `GET /api/keep-alive` displays the last ping timestamp, ping duration, and server status. Adding `?ping=true` triggers an immediate manual ping.

---

## API Endpoints

### 1. Health & Keep-Alive Checks
- **`GET /health`** or **`GET /api/health`**
  - Verifies that the API server is alive and queries PostgreSQL (`SELECT 1`).
- **`GET /api/keep-alive`**
  - Returns keep-alive worker status, uptime, and last ping details.
  - Query parameter `?ping=true` triggers a real-time database ping.

### 2. Authentication & User Sync
- **`POST /api/auth/logout`**: Clears access, refresh, and session cookies.
- **`POST /api/users/sync`**: Synchronizes a newly authenticated or updated user from Supabase to the PostgreSQL database.

### 3. Notes API
- **`GET /api/notes?userId=<id>`**: Returns non-trashed notes for user.
- **`POST /api/notes`**: Creates a new note (`{ userId, title, content }`).
- **`PATCH /api/notes/:id`**: Updates note fields (title, content, is_trash).
- **`GET /api/notes/trash?userId=<id>`**: Returns all soft-deleted notes (`is_trash = true`).
- **`DELETE /api/notes/:id`**: Soft-deletes a note (moves to trash).
- **`DELETE /api/notes/:id/permanent`**: Permanently deletes a note record from the database.
