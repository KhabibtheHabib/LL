import { createClient } from '@supabase/supabase-js';
import { demoTimeSlots, demoMenuItems, demoOrderHistory } from './demo-data';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'lineless-lunch@1.0.0'
    }
  },
});

export interface TimeSlot {
  id: string;
  locationId: string;
  time: string;
  available: number;
  capacity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  inventory: number;
  preparation_time: number;
  is_available: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  time_slot_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  created_at: string;
  pickup_time: string;
  location: string;
}

export interface OrderItem {
  menu_item_id: string;
  quantity: number;
}

export async function getAvailableTimeSlots(date: string): Promise<TimeSlot[]> {
  if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
    return demoTimeSlots.filter(slot => slot.date === date);
  }

  const { data, error } = await supabase
    .from('time_slots')
    .select(`
      id,
      location_id,
      time,
      available_slots,
      capacity
    `)
    .eq('date', date)
    .gt('available_slots', 0)
    .order('time');

  if (error) throw error;
  return data.map(slot => ({
    id: slot.id,
    locationId: slot.location_id,
    time: slot.time,
    available: slot.available_slots,
    capacity: slot.capacity
  }));
}

export async function getMenuItems(): Promise<MenuItem[]> {
  if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
    return demoMenuItems;
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category, name');

  if (error) throw error;
  return data || [];
}

export async function reserveTimeSlot(slotId: string): Promise<boolean> {
  if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
    return true; // Always succeed in demo mode
  }

  const { data, error } = await supabase.rpc('reserve_time_slot', {
    slot_id: slotId
  });

  if (error) throw error;
  return data;
}

export async function createOrder(
  userId: string,
  timeSlotId: string,
  items: OrderItem[]
): Promise<{ id: string; status: string }> {
  if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
    return {
      id: `demo-order-${Date.now()}`,
      status: 'pending'
    };
  }

  const { data, error } = await supabase.rpc('create_order', {
    p_user_id: userId,
    p_time_slot_id: timeSlotId,
    p_items: items
  });

  if (error) throw error;
  return data;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
    return demoOrderHistory;
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      time_slot:time_slots(
        date,
        time,
        location:locations(name)
      ),
      items:order_items(
        quantity,
        menu_item:menu_items(name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProfile(userId: string) {
  if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
    return demoProfile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}