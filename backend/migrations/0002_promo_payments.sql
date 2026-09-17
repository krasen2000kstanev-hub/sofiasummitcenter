ALTER TABLE promo_codes ADD COLUMN single_discount_percent INTEGER NOT NULL DEFAULT 20;
ALTER TABLE promo_codes ADD COLUMN group_discount_percent INTEGER NOT NULL DEFAULT 25;
ALTER TABLE promo_codes ADD COLUMN usage_limit INTEGER;
ALTER TABLE orders ADD COLUMN base_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS promo_payment_links (
  id TEXT PRIMARY KEY,
  promo_code_id TEXT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  ticket_key TEXT NOT NULL,
  attendee_count INTEGER NOT NULL CHECK (attendee_count BETWEEN 1 AND 100),
  payment_url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(promo_code_id, ticket_key, attendee_count)
);

CREATE INDEX IF NOT EXISTS idx_promo_payment_links_lookup ON promo_payment_links(promo_code_id, ticket_key, attendee_count, active);

UPDATE ticket_types SET dsk_url='https://epg.dskbank.bg/sc/ktgERYKucdkhyuRK' WHERE event_id='event-nail-business-restart' AND ticket_key='standard';
UPDATE ticket_types SET dsk_url='https://epg.dskbank.bg/sc/SjnQoLEBzCJjpSSi' WHERE event_id='event-nail-business-restart' AND ticket_key='standard_recording';
UPDATE ticket_types SET dsk_url='https://epg.dskbank.bg/sc/OWhxRZDYrhsnFIdc' WHERE event_id='event-nail-business-restart' AND ticket_key='vip';
