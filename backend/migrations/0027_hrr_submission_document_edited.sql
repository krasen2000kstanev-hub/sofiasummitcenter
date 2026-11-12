-- One document per submission (PDF/Office/TXT, data URL up to ~1 MB) in its own row, and when the student last edited it.
CREATE TABLE IF NOT EXISTS hrr_submission_files (
  submission_id TEXT PRIMARY KEY REFERENCES hrr_submissions(id),
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
ALTER TABLE hrr_submissions ADD COLUMN edited_at TEXT;
