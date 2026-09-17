INSERT OR IGNORE INTO promo_codes
  (id,event_id,code,discount_type,discount_value,ticket_keys_json,active,single_discount_percent,group_discount_percent)
VALUES
  ('promo-irina20','event-nail-business-restart','IRINA20','percent',20,'[]',1,20,25),
  ('promo-lina20','event-nail-business-restart','LINA20','percent',20,'[]',1,20,25),
  ('promo-iliyana20','event-nail-business-restart','ILIYANA20','percent',20,'[]',1,20,25),
  ('promo-zlatina20','event-nail-business-restart','ZLATINA20','percent',20,'[]',1,20,25),
  ('promo-iren20','event-nail-business-restart','IREN20','percent',20,'[]',1,20,25);

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-standard-1', p.id, 'standard', 1,
  'https://epg.dskbank.bg/sc/wAUMHVlxDojEZtcg', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('IRINA20','LINA20','ILIYANA20','ZLATINA20','IREN20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-standard-recording-1', p.id, 'standard_recording', 1,
  'https://epg.dskbank.bg/sc/zTwEtiDVdbLzXjde', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('IRINA20','LINA20','ILIYANA20','ZLATINA20','IREN20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-vip-1', p.id, 'vip', 1,
  'https://epg.dskbank.bg/sc/GWxuABtxAUpCaEQR', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('IRINA20','LINA20','ILIYANA20','ZLATINA20','IREN20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-standard-2', p.id, 'standard', 2,
  'https://epg.dskbank.bg/sc/TRIUNenQNHWhsPgU', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('IRINA20','LINA20','ILIYANA20','ZLATINA20','IREN20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-standard-recording-2', p.id, 'standard_recording', 2,
  'https://epg.dskbank.bg/sc/TaLuqbWTDVVZklMU', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('IRINA20','LINA20','ILIYANA20','ZLATINA20','IREN20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-vip-2', p.id, 'vip', 2,
  'https://epg.dskbank.bg/sc/GNHYplyQjAfCWsle', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('IRINA20','LINA20','ILIYANA20','ZLATINA20','IREN20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;
