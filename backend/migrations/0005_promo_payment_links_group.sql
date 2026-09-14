INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-standard-2', p.id, 'standard', 2,
  'https://epg.dskbank.bg/sc/TRIUNenQNHWhsPgU', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('BIBI20','EVA20','EMI20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-standard-recording-2', p.id, 'standard_recording', 2,
  'https://epg.dskbank.bg/sc/TaLuqbWTDVVZklMU', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('BIBI20','EVA20','EMI20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-' || p.code || '-vip-2', p.id, 'vip', 2,
  'https://epg.dskbank.bg/sc/GNHYplyQjAfCWsle', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.code IN ('BIBI20','EVA20','EMI20')
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;
