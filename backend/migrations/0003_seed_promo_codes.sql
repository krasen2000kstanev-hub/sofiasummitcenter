INSERT OR IGNORE INTO promo_codes
  (id,event_id,code,discount_type,discount_value,ticket_keys_json,active,single_discount_percent,group_discount_percent)
VALUES
  ('promo-bibi20','event-nail-business-restart','BIBI20','percent',20,'[]',1,20,25),
  ('promo-eva20','event-nail-business-restart','EVA20','percent',20,'[]',1,20,25),
  ('promo-emi20','event-nail-business-restart','EMI20','percent',20,'[]',1,20,25);
