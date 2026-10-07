UPDATE promo_codes
SET single_discount_percent = 20,
    group_discount_percent = 20,
    discount_value = 20
WHERE event_id = 'event-nail-business-restart'
  AND code = 'IRINA20';
