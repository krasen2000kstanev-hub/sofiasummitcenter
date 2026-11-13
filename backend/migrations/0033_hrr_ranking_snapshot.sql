-- One precomputed ranking row, refreshed by the 5-minute cron; /api/hrr/ranking reads only this.
CREATE TABLE IF NOT EXISTS hrr_ranking_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
