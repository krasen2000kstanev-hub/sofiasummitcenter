-- Photo evidence (compressed data URL, max ~1 MB) and per-submission bonus points awarded by the mentor on approval.
ALTER TABLE hrr_submissions ADD COLUMN evidence_image TEXT NOT NULL DEFAULT '';
ALTER TABLE hrr_submissions ADD COLUMN bonus_points INTEGER NOT NULL DEFAULT 0;
