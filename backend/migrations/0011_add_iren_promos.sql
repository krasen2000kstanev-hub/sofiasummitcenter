INSERT OR IGNORE INTO promo_codes
  (id,event_id,code,discount_type,discount_value,ticket_keys_json,active,single_discount_percent,group_discount_percent)
VALUES
  ('promo-iren50','event-nail-business-restart','IREN50','percent',50,'[]',1,50,50),
  ('promo-iren100','event-nail-business-restart','IREN100','percent',100,'[]',1,100,100);

UPDATE promo_codes
SET active=1, discount_type='percent', discount_value=50,
    single_discount_percent=50, group_discount_percent=50
WHERE event_id='event-nail-business-restart' AND code='IREN50';

UPDATE promo_codes
SET active=1, discount_type='percent', discount_value=100,
    single_discount_percent=100, group_discount_percent=100
WHERE event_id='event-nail-business-restart' AND code='IREN100';
