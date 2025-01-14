import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ShoppingBag, X, Clock, MapPin, Zap } from 'lucide-react';
import { useCartStore, ItemCategory } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { getAvailableTimeSlots, reserveTimeSlot, createOrder } from '../lib/supabase';
import { demoTimeSlots } from '../lib/demo-data';
import toast from 'react-hot-toast';

import { supabase } from '../lib/supabase';

const CATEGORIES: ItemCategory[] = ['Main Course', 'Fruits & Vegetables', 'Drinks'];

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [useQuickQueue, setUseQuickQueue] = useState(false);
  
  const { 
    items, 
    removeItem, 
    selectedTimeSlot, 
    setSelectedTimeSlot, 
    clearCart, 
    getTotalPrepTime,
    isCartComplete 
  } = useCartStore();
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadTimeSlots();
    }
  }, [isOpen, selectedDate]);

  const loadTimeSlots = async () => {
    try {
      let slots;
      if (user?.isDemo) {
        slots = demoTimeSlots.filter(slot => slot.date === selectedDate);
      } else {
        slots = await getAvailableTimeSlots(selectedDate);
      }
      setTimeSlots(slots);
      
      // If using QuickQueue, automatically select earliest slot
      if (useQuickQueue && slots.length > 0) {
        setSelectedTimeSlot(slots[0]);
      }
    } catch (error) {
      console.error('Failed to load time slots:', error);
      toast.error('Failed to load available time slots');
    }
  };

  const handleQuickQueue = () => {
    const allSlots = timeSlots;
    if (allSlots.length === 0) {
      toast.error('No available time slots found');
      return;
    }
    
    // Find earliest available slot
    const earliestSlot = allSlots[0]; // Slots are already sorted by time
    setSelectedTimeSlot(earliestSlot);
    setSelectedDate(earliestSlot.date);
    toast.success('Found the earliest available slot!');
  };

  const handleCheckout = async () => {
    // Check if user has already ordered today
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if user already has a pending order
    if (!user.isDemo) {
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        toast.error('You have already placed an order today');
        return;
      }
    } else {
      // For demo mode, check local storage
      const lastOrderDate = localStorage.getItem('demo_last_order_date');
      if (lastOrderDate === today) {
        toast.error('You have already placed an order today');
        return;
      }
    }

    if (!user) {
      setIsOpen(false);
      navigate('/signin');
      return;
    }

    if (!selectedTimeSlot) {
      toast.error('Please select a pickup time');
      return;
    }

    if (!isCartComplete()) {
      toast.error('Please select one item from each category');
      return;
    }

    setLoading(true);
    try {
      if (user.isDemo) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store demo order in localStorage
        const demoOrder = {
          id: `demo-order-${Date.now()}`,
          status: 'preparing',
          created_at: new Date().toISOString(),
          items: items.map(item => ({
            menu_item: { name: item.name },
            quantity: item.quantity
          })),
          time_slot: {
            date: selectedTimeSlot.date,
            time: selectedTimeSlot.time,
            location: { name: selectedTimeSlot.location.name }
          }
        };
        
        localStorage.setItem('demo_last_order_date', today);
        const demoOrdersKey = 'demo_orders';
        const existingOrders = localStorage.getItem(demoOrdersKey);
        const orders = existingOrders ? JSON.parse(existingOrders) : [];
        
        // Add new order to the beginning of the array
        orders.unshift(demoOrder);
        
        // Save updated orders
        localStorage.setItem(demoOrdersKey, JSON.stringify(orders));
        
        clearCart();
        setIsOpen(false);
        toast.success('Demo order placed successfully!');
        navigate('/dashboard');
        return;
      }

      const success = await reserveTimeSlot(selectedTimeSlot.id);
      if (!success) {
        toast.error('Selected time slot is no longer available');
        return;
      }

      const orderItems = items.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity
      }));

      await createOrder(user.id, selectedTimeSlot.id, orderItems);
      clearCart();
      setIsOpen(false);
      toast.success('Order placed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-700 hover:text-orange-500"
      >
        <ShoppingBag className="h-6 w-6" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {items.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-0 h-full w-full max-w-md">
            <div className="h-full bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cart Items */}
                    {CATEGORIES.map((category) => (
                      <div key={category} className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">{category}</h3>
                        {items.find(item => item.category === category) ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <img
                                src={items.find(item => item.category === category)?.image}
                                alt={items.find(item => item.category === category)?.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <span>{items.find(item => item.category === category)?.name}</span>
                            </div>
                            <button
                              onClick={() => removeItem(items.find(item => item.category === category)!.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No item selected</p>
                        )}
                      </div>
                    ))}

                    {/* Quick Queue Button */}
                    <div className="border-t pt-4">
                      <button
                        onClick={() => {
                          setUseQuickQueue(!useQuickQueue);
                          if (!useQuickQueue) handleQuickQueue();
                        }}
                        className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg border ${
                          useQuickQueue 
                            ? 'bg-orange-500 text-white border-orange-500' 
                            : 'border-gray-300 hover:border-orange-500'
                        }`}
                      >
                        <Zap className={`h-5 w-5 ${useQuickQueue ? 'text-white' : 'text-orange-500'}`} />
                        <span>{useQuickQueue ? 'Switch to Manual Selection' : 'Use QuickQueue™'}</span>
                      </button>
                      {useQuickQueue && (
                        <p className="text-sm text-gray-500 mt-2">
                          QuickQueue™ automatically assigns you to the earliest available slot
                        </p>
                      )}
                    </div>

                    {/* Manual Time Selection */}
                    {!useQuickQueue && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pickup Date
                          </label>
                          <input
                            type="date"
                            value={selectedDate}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => {
                              setSelectedDate(e.target.value);
                              setSelectedTimeSlot(null);
                            }}
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>

                        {timeSlots.length > 0 ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pickup Time & Location
                            </label>
                            <div className="space-y-2">
                              {timeSlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  onClick={() => setSelectedTimeSlot(slot)}
                                  className={`w-full p-3 rounded-lg border ${
                                    selectedTimeSlot?.id === slot.id
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <span>{slot.time}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                      <MapPin className="h-4 w-4" />
                                      <span>{slot.location.name}</span>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No available time slots for selected date
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              {items.length > 0 && (
                <div className="border-t p-4">
                  {getTotalPrepTime() > 0 && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Estimated prep time: {getTotalPrepTime()} mins</span>
                    </div>
                  )}
                  <button
                    onClick={handleCheckout}
                    disabled={loading || !selectedTimeSlot || !isCartComplete()}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}