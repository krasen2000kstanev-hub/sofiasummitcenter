-- The ranking tab of the season sheet as last read by the 5-minute cron; the student portal shows team points from here, so they match the sheet.
CREATE TABLE IF NOT EXISTS hrr_sheet_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
