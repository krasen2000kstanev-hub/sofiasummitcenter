-- regular | secret | bonus. Secret and bonus missions are masked for students until they contact the organisers.
ALTER TABLE hrr_missions ADD COLUMN kind TEXT NOT NULL DEFAULT 'regular';
