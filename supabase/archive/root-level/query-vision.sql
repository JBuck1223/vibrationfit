-- Query the specific vision to see detail levels
SELECT 
  id,
  title,
  forward,
  fun,
  travel,
  home,
  family,
  romance,
  health,
  money,
  business,
  social,
  possessions,
  giving,
  spirituality,
  conclusion,
  LENGTH(forward) as forward_length,
  LENGTH(fun) as fun_length,
  LENGTH(travel) as travel_length,
  LENGTH(health) as health_length,
  LENGTH(money) as money_length,
  LENGTH(business) as business_length
FROM vision_versions
WHERE id = 'bd8e6440-a65b-4b01-bca0-28ae8e875b3f';
