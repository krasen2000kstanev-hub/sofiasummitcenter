INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-IREN50-standard-1', p.id, 'standard', 1,
  'https://epg.dskbank.bg/sc/DRTQoSEasZrOTlXJ', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.event_id='event-nail-business-restart' AND p.code='IREN50'
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-IREN50-standard-recording-1', p.id, 'standard_recording', 1,
  'https://epg.dskbank.bg/sc/LcVzqxddibTcFySZ', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.event_id='event-nail-business-restart' AND p.code='IREN50'
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;

INSERT INTO promo_payment_links
  (id,promo_code_id,ticket_key,attendee_count,payment_url,active,created_at,updated_at)
SELECT 'plink-IREN50-vip-1', p.id, 'vip', 1,
  'https://epg.dskbank.bg/sc/mfEXCpvkeGOuecEB', 1, datetime('now'), datetime('now')
FROM promo_codes p WHERE p.event_id='event-nail-business-restart' AND p.code='IREN50'
ON CONFLICT(promo_code_id,ticket_key,attendee_count) DO UPDATE SET payment_url=excluded.payment_url,active=1,updated_at=excluded.updated_at;
