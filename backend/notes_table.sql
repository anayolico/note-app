-- Run this in your Neon SQL Editor to create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Note',
  content TEXT DEFAULT '',
  is_trash BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookup by user
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes (user_id);
-- Index for search
CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING gin(to_tsvector('english', title || ' ' || content));
