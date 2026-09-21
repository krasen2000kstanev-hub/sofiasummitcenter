CREATE TABLE IF NOT EXISTS hrr_seasons (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hrr_users (
  id TEXT PRIMARY KEY,
  cognito_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','mentor','admin')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hrr_mentor_allowlist (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'mentor' CHECK (role IN ('mentor','admin')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hrr_teams (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES hrr_seasons(id),
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  join_code_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hrr_team_members (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES hrr_seasons(id),
  team_id TEXT NOT NULL REFERENCES hrr_teams(id),
  user_id TEXT NOT NULL REFERENCES hrr_users(id),
  active INTEGER NOT NULL DEFAULT 1,
  joined_at TEXT NOT NULL,
  UNIQUE(team_id,user_id)
);

CREATE TABLE IF NOT EXISTS hrr_missions (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES hrr_seasons(id),
  mentor_user_id TEXT NOT NULL REFERENCES hrr_users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  points INTEGER NOT NULL DEFAULT 0,
  deadline TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT 'team' CHECK (scope IN ('individual','team')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hrr_submissions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES hrr_missions(id),
  team_id TEXT NOT NULL REFERENCES hrr_teams(id),
  student_user_id TEXT NOT NULL REFERENCES hrr_users(id),
  evidence_url TEXT NOT NULL DEFAULT '',
  evidence_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_user_id TEXT REFERENCES hrr_users(id),
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS hrr_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES hrr_users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS hrr_members_user_idx ON hrr_team_members(user_id,active);
CREATE INDEX IF NOT EXISTS hrr_missions_mentor_idx ON hrr_missions(mentor_user_id,status);
CREATE INDEX IF NOT EXISTS hrr_submissions_status_idx ON hrr_submissions(status,created_at);
CREATE INDEX IF NOT EXISTS hrr_notifications_user_idx ON hrr_notifications(user_id,created_at);

INSERT OR IGNORE INTO hrr_seasons (id,slug,name,status,created_at) VALUES ('hrr_season_8','season-8','Сезон 8','active',datetime('now'));
