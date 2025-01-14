import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ShoppingBag, X, Clock, MapPin } from 'lucide-react';
import { useCartStore, ItemCategory } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { getAvailableTimeSlots, reserveTimeSlot, createOrder } from '../lib/supabase';
import toast from 'react-hot-toast';

const CATEGORIES: ItemCategory[] = ['Main Course', 'Fruits & Vegetables', 'Drinks'];

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
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
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate]);

  const loadTimeSlots = async () => {
    try {
      const slots = await getAvailableTimeSlots(selectedDate);
      setTimeSlots(slots);
    } catch (error) {
      toast.error('Failed to load time slots');
    }
  };

  const handleCheckout = async () => {
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
      const success = await reserveTimeSlot(selectedTimeSlot);
      if (!success) {
        toast.error('Selected time slot is no longer available');
        return;
      }

      const orderItems = items.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity
      }));

      await createOrder(user.id, selectedTimeSlot, orderItems);
      clearCart();
      setIsOpen(false);
      toast.success('Order placed successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const categorizedItems = items.reduce((acc, item) => {
    acc[item.category] = item;
    return acc;
  }, {} as Record<ItemCategory, typeof items[0]>);

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
                    {CATEGORIES.map((category) => (
                      <div key={category} className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">{category}</h3>
                        {categorizedItems[category] ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <img
                                src={categorizedItems[category].image}
                                alt={categorizedItems[category].name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <span>{categorizedItems[category].name}</span>
                            </div>
                            <button
                              onClick={() => removeItem(categorizedItems[category].id)}
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

                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pickup Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>

                      {timeSlots.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pickup Time & Location
                          </label>
                          <div className="space-y-2">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedTimeSlot(slot.id)}
                                className={`w-full p-3 rounded-lg border ${
                                  selectedTimeSlot === slot.id
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
                                    <span>{slot.location}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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