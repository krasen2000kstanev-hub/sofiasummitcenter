-- Team roster: which email belongs to which team. Filled from the season sheet via /api/hrr/admin/teams/sync,
-- so student emails never live in this public repository.
CREATE TABLE IF NOT EXISTS hrr_team_roster (
  season_id TEXT NOT NULL REFERENCES hrr_seasons(id),
  email TEXT NOT NULL,
  team_id TEXT NOT NULL REFERENCES hrr_teams(id),
  PRIMARY KEY (season_id, email)
);
ALTER TABLE hrr_users ADD COLUMN roster_alert_season TEXT NOT NULL DEFAULT '';
