ALTER TABLE attendees ADD COLUMN ticket_token TEXT;
ALTER TABLE attendees ADD COLUMN checked_in_at TEXT;
ALTER TABLE email_log ADD COLUMN attendee_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendees_ticket_token ON attendees(ticket_token);
CREATE INDEX IF NOT EXISTS idx_attendees_order ON attendees(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_log_ticket_once ON email_log(order_id, attendee_id, email_type);
