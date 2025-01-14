/*
  # Initial Schema Setup

  1. New Tables
    - `locations` - Stores pickup locations
    - `menu_items` - Stores available menu items with inventory tracking
    - `time_slots` - Stores available pickup time slots
    - `orders` - Stores customer orders
    - `order_items` - Stores items within each order

  2. Security
    - Enable RLS on all tables
    - Add policies for public access to menu items, time slots, and locations
    - Add policies for authenticated user access to orders

  3. Functions
    - Add order status management
    - Add inventory tracking
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  inventory INTEGER DEFAULT 0,
  preparation_time INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  available_slots INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_capacity CHECK (capacity > 0),
  CONSTRAINT valid_available_slots CHECK (available_slots >= 0 AND available_slots <= capacity)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  time_slot_id UUID REFERENCES time_slots(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Menu items are viewable by everyone"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "Time slots are viewable by everyone"
  ON time_slots FOR SELECT
  USING (true);

CREATE POLICY "Locations are viewable by everyone"
  ON locations FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

-- Create inventory update function
CREATE OR REPLACE FUNCTION update_inventory(
  item_id UUID,
  quantity_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE menu_items
  SET 
    inventory = inventory + quantity_change,
    is_available = CASE 
      WHEN inventory + quantity_change > 0 THEN true
      ELSE false
    END,
    updated_at = NOW()
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Create order status trigger function
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

-- Create order status trigger
CREATE TRIGGER order_status_update
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();