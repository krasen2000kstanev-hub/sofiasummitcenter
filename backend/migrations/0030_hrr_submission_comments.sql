-- Conversation between mentor and students on a submission, shown in the platform.
CREATE TABLE IF NOT EXISTS hrr_submission_comments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES hrr_submissions(id),
  user_id TEXT NOT NULL REFERENCES hrr_users(id),
  author_role TEXT NOT NULL CHECK (author_role IN ('student','mentor')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hrr_submission_comments_idx ON hrr_submission_comments(submission_id, created_at);
