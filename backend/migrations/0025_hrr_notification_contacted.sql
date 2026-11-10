-- When an admin emailed the person behind a roster alert from the panel.
ALTER TABLE hrr_notifications ADD COLUMN contacted_at TEXT;
