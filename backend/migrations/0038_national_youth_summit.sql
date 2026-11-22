-- Национален младежки Summit: безплатна регистрация с автоматичен билет (POST /api/free-registrations).
ALTER TABLE attendees ADD COLUMN organization TEXT;

INSERT OR IGNORE INTO events (id, slug, name, starts_at, venue, capacity, status, created_at, updated_at)
VALUES ('event-national-youth-summit', 'national-youth-summit', 'Национален младежки Summit', '2026-12-02T10:00:00+02:00', 'Sofia Summit Center', 200, 'active', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO ticket_types (id, event_id, ticket_key, name, price_cents, currency, dsk_url, active)
VALUES ('ticket-nys-free', 'event-national-youth-summit', 'free', 'Безплатно участие', 0, 'EUR', '', 1);
