-- Keep the organiser's current promo codes active in production.
INSERT OR IGNORE INTO promo_codes
  (id,event_id,code,discount_type,discount_value,ticket_keys_json,active,single_discount_percent,group_discount_percent)
VALUES
  ('promo-ogi20','event-nail-business-restart','OGI20','percent',20,'[]',1,20,25);

UPDATE promo_codes
SET active=1, discount_type='percent', discount_value=20,
    single_discount_percent=20, group_discount_percent=25
WHERE event_id='event-nail-business-restart'
  AND code IN ('BIBI20','EVA20','EMI20','IRINA20','LINA20','ILIYANA20','ZLATINA20','IREN20','BORISLAVA20','ELENA20','OGI20');
