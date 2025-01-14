-- Trigger to maintain time slot availability
CREATE OR REPLACE FUNCTION update_time_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update available slots when order is created
  IF TG_OP = 'INSERT' THEN
    UPDATE time_slots
    SET available_slots = available_slots - 1
    WHERE id = NEW.time_slot_id;
  END IF;
  
  -- Update available slots when order is cancelled
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE time_slots
    SET available_slots = available_slots + 1
    WHERE id = NEW.time_slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_slot_availability
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_time_slot_availability();

-- Trigger to validate inventory before order
CREATE OR REPLACE FUNCTION validate_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if item is available and has sufficient inventory
  IF NOT EXISTS (
    SELECT 1
    FROM menu_items
    WHERE id = NEW.menu_item_id
    AND is_available = true
    AND inventory >= NEW.quantity
  ) THEN
    RAISE EXCEPTION 'Item is not available or has insufficient inventory';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_inventory
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_inventory();

-- Trigger to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_stats (user_id, total_orders, total_spent)
    VALUES (NEW.user_id, 1, NEW.total_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET total_orders = user_stats.total_orders + 1,
        total_spent = user_stats.total_spent + NEW.total_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_stats_update
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();