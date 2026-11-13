-- Organizer points are either activity points (sheet column E, the default) or mission points (column F).
ALTER TABLE hrr_bonus_awards ADD COLUMN kind TEXT NOT NULL DEFAULT 'activity' CHECK (kind IN ('activity','mission'));
