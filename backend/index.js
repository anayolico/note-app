const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database Connection (Supabase PostgreSQL / Connection Pooler)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Automatic Database Initialization
const initDb = async () => {
  try {
    console.log('Initializing database tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT DEFAULT 'New Note',
        content TEXT DEFAULT '',
        is_trash BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes (user_id);
    `);
    console.log('Database tables initialized successfully.');
    // Trigger initial keep-alive ping on startup
    await pingDatabase('startup');
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  }
};

// --- Supabase Activity Keep-Alive Worker ---
// Supabase free tier projects pause after 7 days of inactivity.
// This scheduled task pings the database every 48 hours (configurable) to maintain activity.
const KEEP_ALIVE_INTERVAL_HOURS = parseFloat(process.env.KEEP_ALIVE_INTERVAL_HOURS || '48');
const KEEP_ALIVE_INTERVAL_MS = KEEP_ALIVE_INTERVAL_HOURS * 60 * 60 * 1000;

let lastKeepAlivePing = null;
let keepAliveStatus = 'initialized';

const pingDatabase = async (triggerType = 'scheduled') => {
  try {
    const startTime = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*)::int as note_count FROM notes;');
    const duration = Date.now() - startTime;
    
    lastKeepAlivePing = {
      timestamp: new Date().toISOString(),
      durationMs: duration,
      dbTime: result.rows[0]?.current_time,
      noteCount: result.rows[0]?.note_count,
      triggerType,
      status: 'success',
    };
    keepAliveStatus = 'active';
    console.log(`[Keep-Alive Ping] (${triggerType}) Database pinged successfully in ${duration}ms at ${lastKeepAlivePing.timestamp}`);
    return lastKeepAlivePing;
  } catch (err) {
    keepAliveStatus = 'error';
    lastKeepAlivePing = {
      timestamp: new Date().toISOString(),
      error: err.message,
      triggerType,
      status: 'failed',
    };
    console.error(`[Keep-Alive Ping] (${triggerType}) Database ping failed:`, err.message);
    return lastKeepAlivePing;
  }
};

// Start background interval
if (KEEP_ALIVE_INTERVAL_HOURS > 0) {
  console.log(`Keep-alive background task configured: runs every ${KEEP_ALIVE_INTERVAL_HOURS} hours (${KEEP_ALIVE_INTERVAL_MS}ms).`);
  setInterval(() => {
    pingDatabase('scheduled');
  }, KEEP_ALIVE_INTERVAL_MS);
}

initDb();

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Verify database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      message: 'Mindful Canvas API is running (Supabase DB)',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check database query failed:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'API is running but database connection failed',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', async (req, res) => {
  try {
    // Verify database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      message: 'Mindful Canvas API is running (Supabase DB)',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check database query failed:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'API is running but database connection failed',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Keep-Alive status and manual trigger endpoint
app.get('/api/keep-alive', async (req, res) => {
  const shouldPing = req.query.ping === 'true';
  let pingResult = lastKeepAlivePing;
  if (shouldPing || !lastKeepAlivePing) {
    pingResult = await pingDatabase('api_request');
  }

  res.json({
    status: keepAliveStatus,
    intervalHours: KEEP_ALIVE_INTERVAL_HOURS,
    uptimeSeconds: Math.floor(process.uptime()),
    lastPing: pingResult,
  });
});

// Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };

  [
    'access_token',
    'refresh_token',
    'auth_token',
    'token',
    'session',
    'sb-access-token',
    'sb-refresh-token',
  ].forEach((cookieName) => {
    res.clearCookie(cookieName, cookieOptions);
  });

  res.json({
    message: 'Logged out successfully',
    clearStoragePrefixes: ['sb-'],
    clearStorageKeys: ['supabase.auth.token'],
  });
});

// User Sync Endpoint
app.post('/api/users/sync', async (req, res) => {
  const { id, email, full_name, avatar_url } = req.body;

  if (!id || !email) {
    return res.status(400).json({ error: 'ID and Email are required' });
  }

  try {
    const query = `
      INSERT INTO users (id, email, full_name, avatar_url, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [id, email, full_name, avatar_url];
    const result = await pool.query(query, values);
    
    res.json({ message: 'User synced successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Database error during sync:', err);
    res.status(500).json({ error: 'Failed to sync user to database' });
  }
});

// --- Notes API ---

// GET all notes for a user
app.get('/api/notes', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'UserID required' });

  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 AND is_trash = false ORDER BY updated_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST new note
app.post('/api/notes', async (req, res) => {
  const { userId, title, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, title || 'New Note', content || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PATCH update note (Auto-save)
app.patch('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, is_trash } = req.body;
  try {
    const result = await pool.query(
      `UPDATE notes SET 
        title = COALESCE($1, title), 
        content = COALESCE($2, content), 
        is_trash = COALESCE($3, is_trash),
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      [title, content, is_trash, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// GET all trashed notes for a user
app.get('/api/notes/trash', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'UserID required' });

  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 AND is_trash = true ORDER BY updated_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trashed notes' });
  }
});

// DELETE note (move to trash)
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notes SET is_trash = true WHERE id = $1', [id]);
    res.json({ message: 'Note moved to trash' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// DELETE note permanently
app.delete('/api/notes/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ message: 'Note deleted permanently' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to permanently delete note' });
  }
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
