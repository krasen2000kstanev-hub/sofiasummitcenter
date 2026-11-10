-- A student who signs in with an unknown email tells the organizers who they are; the admin adds them with one click.
CREATE TABLE IF NOT EXISTS hrr_roster_requests (
  season_id TEXT NOT NULL REFERENCES hrr_seasons(id),
  user_id TEXT NOT NULL REFERENCES hrr_users(id),
  id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  university TEXT NOT NULL,
  team_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  PRIMARY KEY (season_id, user_id)
);
