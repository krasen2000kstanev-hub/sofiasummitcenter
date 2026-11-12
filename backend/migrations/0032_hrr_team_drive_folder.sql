-- Google Drive folder of each team ("Екип N - УНИ"), filled by the owner's Apps Script via /api/hrr/drive/sync.
ALTER TABLE hrr_teams ADD COLUMN drive_folder_id TEXT;
