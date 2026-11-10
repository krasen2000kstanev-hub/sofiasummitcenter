-- Organizer can tick off a roster alert by hand (e.g. a test account) without giving the email a team.
ALTER TABLE hrr_notifications ADD COLUMN resolved_at TEXT;
