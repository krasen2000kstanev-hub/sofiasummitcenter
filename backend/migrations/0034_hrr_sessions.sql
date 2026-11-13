-- Remembered sign-in: a Google ID token lasts 1 hour, so after verifying it once the platform hands out its own 60-day session.
CREATE TABLE IF NOT EXISTS hrr_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES hrr_users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hrr_sessions_user_idx ON hrr_sessions(user_id);
