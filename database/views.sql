-- Views for common queries

-- Available menu items with inventory
CREATE OR REPLACE VIEW available_menu_items AS
SELECT 
  id,
  name,
  description,
  category,
  image_url,
  inventory,
  preparation_time,
  is_available
FROM menu_items
WHERE is_available = true
AND inventory > 0;

-- Current queue status
CREATE OR REPLACE VIEW current_queue_status AS
SELECT 
  ts.date,
  ts.time,
  l.name as location_name,
  COUNT(o.id) as queue_length,
  ts.capacity,
  ts.available_slots
FROM time_slots ts
JOIN locations l ON l.id = ts.location_id
LEFT JOIN orders o ON o.time_slot_id = ts.id 
  AND o.status IN ('pending', 'preparing')
WHERE ts.date >= CURRENT_DATE
GROUP BY ts.id, l.id;

-- User order history with details
CREATE OR REPLACE VIEW user_order_history AS
SELECT 
  o.id as order_id,
  o.user_id,
  o.status,
  o.created_at,
  ts.date as pickup_date,
  ts.time as pickup_time,
  l.name as location_name,
  json_agg(
    json_build_object(
      'item_name', mi.name,
      'quantity', oi.quantity
    )
  ) as items
FROM orders o
JOIN time_slots ts ON ts.id = o.time_slot_id
JOIN locations l ON l.id = ts.location_id
JOIN order_items oi ON oi.order_id = o.id
JOIN menu_items mi ON mi.id = oi.menu_item_id
GROUP BY o.id, ts.id, l.id;

-- Popular items by time slot
CREATE OR REPLACE VIEW popular_items_by_time AS
SELECT 
  ts.time,
  mi.name as item_name,
  COUNT(*) as order_count
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN time_slots ts ON ts.id = o.time_slot_id
JOIN menu_items mi ON mi.id = oi.menu_item_id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ts.time, mi.id
ORDER BY ts.time, order_count DESC;