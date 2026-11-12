-- Read-only 'viewer' (e.g. a university teacher) in the panel allowlist. Nothing references this table, so it is rebuilt safely.
CREATE TABLE IF NOT EXISTS hrr_mentor_allowlist_v2 (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'mentor' CHECK (role IN ('mentor','admin','viewer')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
INSERT OR IGNORE INTO hrr_mentor_allowlist_v2 (email,role,active,created_at) SELECT email,role,active,created_at FROM hrr_mentor_allowlist;
DROP TABLE hrr_mentor_allowlist;
ALTER TABLE hrr_mentor_allowlist_v2 RENAME TO hrr_mentor_allowlist;
