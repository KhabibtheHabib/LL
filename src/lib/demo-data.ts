import { addDays, format, setHours, setMinutes } from 'date-fns';

// Generate demo time slots for the next 3 days
export const demoTimeSlots = (() => {
  const slots = [];
  const locations = ['Main Cafeteria', 'Student Center'];
  
  // Generate slots for next 90 days to ensure availability
  for (let day = 0; day < 90; day++) {
    // Generate slots between 11:00 AM and 2:00 PM
    for (let hour = 11; hour < 14; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const date = addDays(new Date(), day);
        const slotTime = setMinutes(setHours(date, hour), minute);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Create a slot for each location
        locations.forEach((locationName, locationIndex) => {
          slots.push({
            id: `demo-slot-${day}-${hour}-${minute}-${locationIndex}`,
            date: format(date, 'yyyy-MM-dd'),
            time: format(slotTime, 'HH:mm'),
            available_slots: 20, // Increased availability
            location: {
              id: `loc-${locationIndex}`,
              name: locationName
            }
          });
        });
      }
    }
  }
  return slots;
})();

// Sample menu items for demo mode
export const demoMenuItems = [
  {
    id: 'demo-main-1',
    name: 'Classic Burger',
    description: 'Fresh beef patty with lettuce and tomato',
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300',
    price: 8.99,
    preparation_time: 10,
    is_available: true
  },
  {
    id: 'demo-main-2',
    name: 'Grilled Chicken Sandwich',
    description: 'Seasoned grilled chicken with fresh vegetables',
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=300',
    price: 7.99,
    preparation_time: 8,
    is_available: true
  },
  {
    id: 'demo-side-1',
    name: 'Fresh Apple',
    description: 'Crisp and sweet apple',
    category: 'Fruits & Vegetables',
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300',
    price: 1.50,
    preparation_time: 0,
    is_available: true
  },
  {
    id: 'demo-side-2',
    name: 'Carrot Sticks',
    description: 'Fresh cut carrot sticks',
    category: 'Fruits & Vegetables',
    image_url: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=300',
    price: 2.00,
    preparation_time: 0,
    is_available: true
  },
  {
    id: 'demo-drink-1',
    name: 'Water Bottle',
    description: 'Pure spring water',
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=300',
    price: 1.50,
    preparation_time: 0,
    is_available: true
  },
  {
    id: 'demo-drink-2',
    name: 'Chocolate Milk',
    description: 'Cold chocolate milk',
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300',
    price: 2.50,
    preparation_time: 0,
    is_available: true
  }
];

// Sample order history for demo mode
export const demoOrderHistory = [
  {
    id: 'demo-order-1',
    status: 'preparing',
    created_at: addDays(new Date(), -7).toISOString(),
    items: [
      { menu_item: demoMenuItems[0], quantity: 1 },
      { menu_item: demoMenuItems[2], quantity: 1 },
      { menu_item: demoMenuItems[4], quantity: 1 }
    ],
    time_slot: {
      date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
      time: '12:30',
      location: { name: 'Main Cafeteria' }
    },
    total_amount: 11.99
  },
  {
    id: 'demo-order-2',
    status: 'completed',
    created_at: addDays(new Date(), -14).toISOString(),
    items: [
      { menu_item: demoMenuItems[1], quantity: 1 },
      { menu_item: demoMenuItems[3], quantity: 1 },
      { menu_item: demoMenuItems[5], quantity: 1 }
    ],
    time_slot: {
      date: format(addDays(new Date(), -2), 'yyyy-MM-dd'),
      time: '11:45',
      location: { name: 'Student Center' }
    },
    total_amount: 12.49
  },
  // Add more historical data for time saved chart
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `demo-order-${i + 3}`,
    status: 'completed',
    created_at: addDays(new Date(), -(21 + i * 2)).toISOString(),
    items: [
      { menu_item: demoMenuItems[i % 2], quantity: 1 },
      { menu_item: demoMenuItems[2 + (i % 2)], quantity: 1 },
      { menu_item: demoMenuItems[4 + (i % 2)], quantity: 1 }
    ],
    time_slot: {
      date: format(addDays(new Date(), -(21 + i * 2)), 'yyyy-MM-dd'),
      time: '12:00',
      location: { name: i % 2 === 0 ? 'Main Cafeteria' : 'Student Center' }
    },
    total_amount: 11.99
  }))
];

export const demoProfile = {
  id: 'demo-user',
  email: 'demo@example.com',
  full_name: 'Demo User',
  student_id: '12345678'
};