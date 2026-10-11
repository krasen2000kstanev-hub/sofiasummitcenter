ALTER TABLE hrr_missions ADD COLUMN start_date TEXT NOT NULL DEFAULT '';
ALTER TABLE hrr_missions ADD COLUMN end_date TEXT NOT NULL DEFAULT '';
UPDATE hrr_missions SET end_date=deadline WHERE end_date='' AND deadline<>'';
