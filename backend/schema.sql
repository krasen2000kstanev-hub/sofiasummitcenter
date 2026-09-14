PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  venue TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','closed')),
  retention_days INTEGER NOT NULL DEFAULT 365,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_key TEXT NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  dsk_url TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(event_id, ticket_key)
);

CREATE TABLE IF NOT EXISTS masterclasses (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  masterclass_key TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(event_id, masterclass_key)
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value INTEGER NOT NULL,
  ticket_keys_json TEXT NOT NULL DEFAULT '[]',
  valid_from TEXT,
  valid_until TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  single_discount_percent INTEGER NOT NULL DEFAULT 20 CHECK (single_discount_percent BETWEEN 0 AND 100),
  group_discount_percent INTEGER NOT NULL DEFAULT 25 CHECK (group_discount_percent BETWEEN 0 AND 100),
  usage_limit INTEGER,
  UNIQUE(event_id, code)
);

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

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  attendee_count INTEGER NOT NULL CHECK (attendee_count BETWEEN 1 AND 100),
  promo_code TEXT,
  base_amount_cents INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','paid','expired','cancelled','refunded')),
  payment_url TEXT,
  payment_reference TEXT,
  ticket_token TEXT UNIQUE,
  expires_at TEXT NOT NULL,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendees (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  attendee_no INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  UNIQUE(order_id, attendee_no)
);

CREATE TABLE IF NOT EXISTS order_masterclasses (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  masterclass_id TEXT NOT NULL REFERENCES masterclasses(id),
  PRIMARY KEY(order_id, masterclass_id)
);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  provider TEXT NOT NULL,
  provider_status TEXT NOT NULL,
  provider_reference TEXT,
  payload_hash TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_log (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  recipient TEXT NOT NULL,
  email_type TEXT NOT NULL,
  provider_id TEXT,
  status TEXT NOT NULL,
  sent_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_event_status ON orders(event_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_attendees_order ON attendees(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_order ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_promo_payment_links_lookup ON promo_payment_links(promo_code_id, ticket_key, attendee_count, active);

INSERT OR IGNORE INTO events (id, slug, name, starts_at, venue, capacity, status, created_at, updated_at)
VALUES ('event-nail-business-restart', 'nail-business-restart', 'NAIL BUSINESS RE:START', '2026-10-26T09:00:00+02:00', 'Sofia Summit Center', 100, 'active', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO ticket_types (id, event_id, ticket_key, name, price_cents, currency, dsk_url)
VALUES
  ('ticket-nbr-standard', 'event-nail-business-restart', 'standard', 'Standard', 8900, 'EUR', 'https://epg.dskbank.bg/sc/ktgERYKucdkhyuRK'),
  ('ticket-nbr-standard-recording', 'event-nail-business-restart', 'standard_recording', 'Standard + запис', 11400, 'EUR', 'https://epg.dskbank.bg/sc/SjnQoLEBzCJjpSSi'),
  ('ticket-nbr-vip', 'event-nail-business-restart', 'vip', 'VIP', 12900, 'EUR', 'https://epg.dskbank.bg/sc/OWhxRZDYrhsnFIdc');

INSERT OR IGNORE INTO masterclasses (id, event_id, masterclass_key, name, capacity)
VALUES
  ('mc-nbr-ogi', 'event-nail-business-restart', 'Ogi', 'Огнян Апостолов — AI за маникюристи', NULL),
  ('mc-nbr-borislava', 'event-nail-business-restart', 'Borislava', 'Борислава Иванова — видео съдържание', NULL),
  ('mc-nbr-eli', 'event-nail-business-restart', 'Eli', 'Елена Георгиева — позициониране на бранд', NULL),
  ('mc-nbr-irina', 'event-nail-business-restart', 'Irina', 'Ирина Кулик — изграждане без пилене', NULL),
  ('mc-nbr-zlatina', 'event-nail-business-restart', 'Zlatina', 'Златина Димитрова — горни форми и течен гел', NULL),
  ('mc-nbr-ilIyana', 'event-nail-business-restart', 'Iliyana', 'Илияна Колева — 3D Crystal Flower', NULL);

INSERT OR IGNORE INTO promo_codes
  (id,event_id,code,discount_type,discount_value,ticket_keys_json,active,single_discount_percent,group_discount_percent)
VALUES
  ('promo-bibi20','event-nail-business-restart','BIBI20','percent',20,'[]',1,20,25),
  ('promo-eva20','event-nail-business-restart','EVA20','percent',20,'[]',1,20,25),
  ('promo-emi20','event-nail-business-restart','EMI20','percent',20,'[]',1,20,25);
