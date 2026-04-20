-- Run this in your Neon SQL Editor to create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- This will match Supabase Auth UID
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: In a real app, we would also add an index on email
-- CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
