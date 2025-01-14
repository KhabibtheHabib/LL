import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ShoppingBag, X, Clock, MapPin, Zap, ArrowLeft } from 'lucide-react';
import { useCartStore, ItemCategory } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { getAvailableTimeSlots, reserveTimeSlot, createOrder } from '../lib/supabase';
import { demoTimeSlots } from '../lib/demo-data';
import toast from 'react-hot-toast';

const CATEGORIES: ItemCategory[] = ['Main Course', 'Fruits & Vegetables', 'Drinks'];

export default function CartPage() {
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
    loadTimeSlots();
  }, [selectedDate]);

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
    if (!user) {
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
        clearCart();
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
      toast.success('Order placed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some delicious items from our menu!</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/menu')}
          className="text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold">Your Cart</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {CATEGORIES.map((category) => (
            <div key={category} className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-medium mb-4">{category}</h3>
              {items.find(item => item.category === category) ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={items.find(item => item.category === category)?.image}
                      alt={items.find(item => item.category === category)?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium">
                        {items.find(item => item.category === category)?.name}
                      </h4>
                      <p className="text-gray-500">
                        ${items.find(item => item.category === category)?.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(items.find(item => item.category === category)!.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No item selected</p>
                  <button
                    onClick={() => navigate('/menu')}
                    className="text-orange-500 hover:text-orange-600 mt-2"
                  >
                    Add {category}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Checkout Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
            <h3 className="font-medium mb-6">Pickup Details</h3>

            {/* Quick Queue Button */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setUseQuickQueue(!useQuickQueue);
                  if (!useQuickQueue) handleQuickQueue();
                }}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border ${
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
              <div className="space-y-4 mb-6">
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
                    <div className="space-y-2 max-h-48 overflow-y-auto">
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

            {/* Order Summary */}
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
        </div>
      </div>
    </div>
  );
}