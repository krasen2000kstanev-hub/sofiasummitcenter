-- Organizer bonus points outside missions: to a whole team (user_id NULL) or to one team member.
CREATE TABLE IF NOT EXISTS hrr_bonus_awards (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES hrr_seasons(id),
  team_id TEXT NOT NULL REFERENCES hrr_teams(id),
  user_id TEXT REFERENCES hrr_users(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hrr_bonus_awards_team_idx ON hrr_bonus_awards(team_id);
