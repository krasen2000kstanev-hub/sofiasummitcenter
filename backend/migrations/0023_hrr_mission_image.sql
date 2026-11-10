-- Optional picture attached to a mission by the mentor (compressed data URL, max ~1 MB); served separately from the list.
ALTER TABLE hrr_missions ADD COLUMN image TEXT NOT NULL DEFAULT '';
