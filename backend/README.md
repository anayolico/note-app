# Mindful Canvas - Backend API

This is the backend API server for the Mindful Canvas Note App, built with Node.js, Express, and PostgreSQL. It manages user synchronization from Supabase and handles all note-taking CRUD operations (including soft deleting to a trash bin and permanent deletion).

---

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (accessed via `pg` driver)
- **CORS**: Enabled with credential support, dynamic origin matching the frontend

---

## Project Structure

```
backend/
├── index.js             # Main server logic and API routes
├── package.json         # Node dependencies and scripts
├── .env                 # Local environment variables (git-ignored)
├── .env.example         # Template for environment variables
└── schema.sql           # Database schema definition reference
```

---

## Getting Started

### 1. Prerequisites
- Node.js installed (v16+)
- A PostgreSQL database instance (e.g., Neon Postgres, local Postgres, or Supabase PostgreSQL)

### 2. Environment Setup
Copy `.env.example` to a new file named `.env` and fill in your connection details:
```bash
cp .env.example .env
```
Update the `.env` file with your config:
- `PORT`: Port the server runs on (defaults to `3001`).
- `DATABASE_URL`: PostgreSQL connection URL (e.g. `postgresql://...`).
- `FRONTEND_URL`: URL of the frontend (defaults to allowing all if not specified, useful for CORS).
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
The server executes an automatic table initialization script upon startup:
- **`users` Table**: Stores synchronized user profiles (ID from Supabase, Email, Name, Avatar URL).
- **`notes` Table**: Stores notes linked to users, supporting soft delete status (`is_trash`), creation, and update timestamps.

---

## API Endpoints

### 1. Health Checks
- **`GET /health`** or **`GET /api/health`**
  - **Description**: Verifies that the API server is alive and queries the PostgreSQL database (`SELECT 1`) to verify connection integrity.
  - **Success Response**: `200 OK`
    ```json
    {
      "status": "ok",
      "message": "Mindful Canvas API is running",
      "database": "connected",
      "timestamp": "2026-08-05T20:30:00.000Z"
    }
    ```
  - **Error Response**: `500 Internal Server Error` (if DB connection fails)
    ```json
    {
      "status": "error",
      "message": "API is running but database connection failed",
      "database": "disconnected",
      "error": "Error details...",
      "timestamp": "2026-08-05T20:30:00.000Z"
    }
    ```

### 2. Authentication
- **`POST /api/auth/logout`**
  - **Description**: Clears access, refresh, and session cookies. Responds with instructions for the client to clean up local storage storage.
  - **Success Response**: `200 OK`
    ```json
    {
      "message": "Logged out successfully",
      "clearStoragePrefixes": ["sb-"],
      "clearStorageKeys": ["supabase.auth.token"]
    }
    ```

### 3. User Synchronization
- **`POST /api/users/sync`**
  - **Description**: Synchronizes a newly authenticated or updated user from Supabase to the local PostgreSQL database.
  - **Request Body**:
    ```json
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Jane Doe",
      "avatar_url": "https://..."
    }
    ```
  - **Success Response**: `200 OK` with user details.

### 4. Notes API
- **`GET /api/notes?userId=<id>`**
  - **Description**: Returns all non-trashed notes for the specified user, ordered by `updated_at` descending.
- **`POST /api/notes`**
  - **Description**: Creates a new note for the user.
  - **Request Body**:
    ```json
    {
      "userId": "uuid",
      "title": "My Note Title",
      "content": "Note markdown content"
    }
    ```
- **`PATCH /api/notes/:id`**
  - **Description**: Updates fields of a specific note (auto-saves `title` / `content` / `is_trash`).
  - **Request Body**:
    ```json
    {
      "title": "Updated Title",
      "content": "Updated content",
      "is_trash": false
    }
    ```
- **`GET /api/notes/trash?userId=<id>`**
  - **Description**: Returns all soft-deleted notes (`is_trash = true`) for the specified user.
- **`DELETE /api/notes/:id`**
  - **Description**: Soft deletes a note by setting its `is_trash` flag to `true`.
- **`DELETE /api/notes/:id/permanent`**
  - **Description**: Permanently deletes a note record from the database.
