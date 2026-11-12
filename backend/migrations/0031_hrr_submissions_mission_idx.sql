-- Students' missions list looks up the latest submission per mission; without this index it scans every submission per mission.
CREATE INDEX IF NOT EXISTS hrr_submissions_mission_idx ON hrr_submissions(mission_id, created_at);
