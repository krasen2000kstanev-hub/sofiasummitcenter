-- Several photos per submission (one row each, ~1 MB) and documents up to 4 MB split into ~1 MB parts (a D1 row holds at most 2 MB).
CREATE TABLE IF NOT EXISTS hrr_submission_images (
  submission_id TEXT NOT NULL REFERENCES hrr_submissions(id),
  position INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (submission_id, position)
);
INSERT OR IGNORE INTO hrr_submission_images (submission_id,position,data) SELECT id,0,evidence_image FROM hrr_submissions WHERE evidence_image<>'';
UPDATE hrr_submissions SET evidence_image='' WHERE evidence_image<>'';
CREATE TABLE IF NOT EXISTS hrr_submission_file_parts (
  submission_id TEXT NOT NULL REFERENCES hrr_submissions(id),
  part INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (submission_id, part)
);
