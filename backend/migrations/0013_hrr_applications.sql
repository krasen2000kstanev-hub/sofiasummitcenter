PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS hrr_applications (
  application_no INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  season INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'company', 'university')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  university TEXT NOT NULL DEFAULT '',
  specialty TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  gdpr_consent INTEGER NOT NULL CHECK (gdpr_consent = 1),
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'contacted', 'accepted', 'declined')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hrr_applications_created_at
  ON hrr_applications(created_at DESC);

CREATE TABLE IF NOT EXISTS hrr_application_outbox (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES hrr_applications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('sheet', 'organizer_email', 'applicant_email')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TEXT NOT NULL,
  locked_at TEXT,
  last_error TEXT,
  provider_id TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(application_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_hrr_application_outbox_due
  ON hrr_application_outbox(status, available_at);
