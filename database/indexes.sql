-- Indexes for performance optimization

-- Time slots indexes
CREATE INDEX idx_time_slots_date ON time_slots(date);
CREATE INDEX idx_time_slots_available ON time_slots(available_slots) WHERE available_slots > 0;

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Menu items indexes
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Profiles indexes
CREATE INDEX idx_profiles_student_id ON profiles(student_id);

-- Composite indexes for common queries
CREATE INDEX idx_time_slots_date_available ON time_slots(date, available_slots);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_menu_items_category_available ON menu_items(category, is_available);