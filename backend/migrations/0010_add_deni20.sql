INSERT OR IGNORE INTO promo_codes
  (id,event_id,code,discount_type,discount_value,ticket_keys_json,active,single_discount_percent,group_discount_percent)
VALUES
  ('promo-deni20','event-nail-business-restart','DENI20','percent',20,'[]',1,20,25);

UPDATE promo_codes
SET active=1, discount_type='percent', discount_value=20,
    single_discount_percent=20, group_discount_percent=25
WHERE event_id='event-nail-business-restart' AND code='DENI20';
