const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Neon Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    `);
    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  }
};

initDb();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mindful Canvas API is running' });
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
