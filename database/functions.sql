-- Function to update inventory
CREATE OR REPLACE FUNCTION update_inventory(
  item_id UUID,
  quantity_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE menu_items
  SET inventory = inventory + quantity_change
  WHERE id = item_id;
  
  -- Automatically update availability based on inventory
  UPDATE menu_items
  SET is_available = CASE 
    WHEN inventory > 0 THEN true
    ELSE false
  END
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue position
CREATE OR REPLACE FUNCTION get_queue_position(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_position INTEGER;
  v_time_slot_id UUID;
BEGIN
  -- Get the time slot for the order
  SELECT time_slot_id INTO v_time_slot_id
  FROM orders
  WHERE id = p_order_id;
  
  -- Calculate position based on creation time
  SELECT position INTO v_position
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as position
    FROM orders
    WHERE time_slot_id = v_time_slot_id
    AND status IN ('pending', 'preparing')
  ) sq
  WHERE id = p_order_id;
  
  RETURN v_position;
END;
$$ LANGUAGE plpgsql;

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', COUNT(*),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'completed'),
    'average_wait_time', 
      AVG(
        EXTRACT(EPOCH FROM (
          CASE 
            WHEN status = 'completed' 
            THEN updated_at - created_at
            ELSE NULL
          END
        ))/60
      ),
    'favorite_items', (
      SELECT json_agg(item)
      FROM (
        SELECT 
          mi.name,
          COUNT(*) as order_count
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE o.user_id = p_user_id
        GROUP BY mi.name
        ORDER BY order_count DESC
        LIMIT 3
      ) item
    ),
    'time_saved', (
      SELECT COALESCE(SUM(mi.preparation_time), 0)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.user_id = p_user_id
      AND o.status = 'completed'
    )
  ) INTO v_result
  FROM orders
  WHERE user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update order status
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all items are available
  IF EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE oi.order_id = NEW.id
    AND mi.inventory < oi.quantity
  ) THEN
    NEW.status = 'cancelled';
    RETURN NEW;
  END IF;
  
  -- Update inventory and mark as preparing
  IF NEW.status = 'pending' THEN
    PERFORM update_inventory(
      oi.menu_item_id,
      -oi.quantity
    )
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
    
    NEW.status = 'preparing';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic order status updates
CREATE TRIGGER order_status_update
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status();