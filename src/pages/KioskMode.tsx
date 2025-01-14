import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clock, MapPin, ArrowRight, X, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { QueueManager } from '../lib/queue';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
  price: number;
  is_available: boolean;
  preparation_time: number;
  allergens?: string[];
  nutritional_info?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface SelectedItems {
  main?: MenuItem;
  side?: MenuItem;
  drink?: MenuItem;
}

export default function KioskMode() {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [showNutritionalInfo, setShowNutritionalInfo] = useState(false);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [showOrderStatus, setShowOrderStatus] = useState(false);

  useEffect(() => {
    loadMenuItems();
    const interval = setInterval(loadMenuItems, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category, name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const verifyStudent = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, balance, dietary_restrictions')
        .eq('student_id', studentId)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Invalid student ID');
        return false;
      }

      // Check if student has sufficient balance
      const orderTotal = calculateTotal();
      if (data.balance < orderTotal) {
        toast.error('Insufficient balance');
        return false;
      }

      // Check dietary restrictions
      if (data.dietary_restrictions) {
        const restrictions = data.dietary_restrictions as string[];
        const violatesRestrictions = Object.values(selectedItems).some(item => 
          item?.allergens?.some(allergen => restrictions.includes(allergen))
        );

        if (violatesRestrictions) {
          toast.error('Order contains items that violate dietary restrictions');
          return false;
        }
      }

      return true;
    } catch (error) {
      toast.error('Failed to verify student ID');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const calculateTotal = () => {
    return Object.values(selectedItems).reduce((sum, item) => sum + (item?.price || 0), 0);
  };

  const handleSubmit = async () => {
    if (!studentId) {
      toast.error('Please enter your student ID');
      return;
    }

    const isValid = await verifyStudent();
    if (!isValid) return;

    setLoading(true);
    try {
      const queueManager = QueueManager.getInstance();
      const optimalSlot = await queueManager.findOptimalSlot();

      if (!optimalSlot) {
        toast.error('No available time slots');
        return;
      }

      const orderItems = Object.values(selectedItems).map(item => ({
        menu_item_id: item!.id,
        quantity: 1
      }));

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', studentId)
        .single();

      if (!profile) {
        toast.error('Student not found');
        return;
      }

      const { data: order, error } = await supabase.rpc('create_order', {
        p_user_id: profile.id,
        p_time_slot_id: optimalSlot.id,
        p_items: orderItems
      });

      if (error) throw error;

      setOrderNumber(order.id);
      setShowOrderStatus(true);
      toast.success('Order placed successfully!');
      
      // Reset state
      setStep(1);
      setSelectedItems({});
      setStudentId('');
      
      // Add to order history
      setOrderHistory(prev => [...prev, { 
        id: order.id, 
        items: Object.values(selectedItems),
        total: calculateTotal(),
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDietary = dietaryFilters.length === 0 || 
                          !item.allergens?.some(allergen => dietaryFilters.includes(allergen));
    return matchesSearch && matchesDietary;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Header with step indicators */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Place Your Order</h1>
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    step === i ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-lg mb-2"
            />
            <div className="flex flex-wrap gap-2">
              {['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setDietaryFilters(prev => 
                    prev.includes(filter) 
                      ? prev.filter(f => f !== filter)
                      : [...prev, filter]
                  )}
                  className={`px-3 py-1 rounded-full text-sm ${
                    dietaryFilters.includes(filter)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold mb-4">Select Main Course</h2>
                <div className="grid grid-cols-2 gap-4">
                  {filteredItems
                    .filter(item => item.category === 'Main Course')
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleItemSelect('main', item);
                          setShowNutritionalInfo(true);
                        }}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          selectedItems.main?.id === item.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                        <div className="text-left">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-orange-500 font-semibold">
                              ${item.price.toFixed(2)}
                            </span>
                            {item.preparation_time > 0 && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{item.preparation_time} mins</span>
                              </div>
                            )}
                          </div>
                          {item.allergens && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.allergens.map(allergen => (
                                <span
                                  key={allergen}
                                  className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs"
                                >
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Similar sections for sides and drinks... */}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold">Review & Complete Order</h2>
                <div className="space-y-4">
                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Selected Items</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedItems).map(([type, item]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between p-3 bg-white rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-500 capitalize">{type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="font-semibold">${item.price.toFixed(2)}</span>
                            <button
                              onClick={() => {
                                const newItems = { ...selectedItems };
                                delete newItems[type as keyof SelectedItems];
                                setSelectedItems(newItems);
                              }}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-right">
                      <span className="text-lg font-semibold">
                        Total: ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Student ID Input */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Student Information</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Enter Student ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Estimated Preparation Time</h3>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-2" />
                      <span>
                        {Math.max(
                          ...Object.values(selectedItems).map(
                            item => item.preparation_time
                          )
                        )}{' '}
                        minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || verifying || !studentId || Object.keys(selectedItems).length < 3}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading || verifying ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>{verifying ? 'Verifying...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (step === 1 && !selectedItems.main) {
                  toast.error('Please select a main course');
                  return;
                }
                if (step === 2 && (!selectedItems.side || !selectedItems.drink)) {
                  toast.error('Please select both a side and a drink');
                  return;
                }
                setStep(Math.min(3, step + 1));
              }}
              disabled={step === 3}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </motion.div>
      </div>

      {/* Nutritional Info Modal */}
      {showNutritionalInfo && selectedItems.main && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nutritional Information</h3>
              <button
                onClick={() => setShowNutritionalInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {selectedItems.main.nutritional_info && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Calories</div>
                    <div className="text-xl font-semibold">
                      {selectedItems.main.nutritional_info.calories}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Protein</div>
                    <div className="text-xl font-semibold">
                      {selectedItems.main.nutritional_info.protein}g
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Carbs</div>
                    <div className="text-xl font-semibold">
                      {selectedItems.main.nutritional_info.carbs}g
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Fat</div>
                    <div className="text-xl font-semibold">
                      {selectedItems.main.nutritional_info.fat}g
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Order Status Modal */}
      {showOrderStatus && orderNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center"
          >
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Order Confirmed!</h3>
              <p className="text-gray-600">Your order number is:</p>
              <p className="text-2xl font-bold text-orange-500 my-2">
                #{orderNumber.slice(0, 8)}
              </p>
            </div>
            <button
              onClick={() => setShowOrderStatus(false)}
              className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}