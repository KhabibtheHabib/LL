import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Save, RefreshCw, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  inventory: number;
  description: string;
  image_url: string;
  preparation_time: number;
  is_available: boolean;
}

interface OrderStatus {
  id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: any[];
  created_at: string;
  user: {
    full_name: string;
    student_id: string;
  };
}

export default function EmployeeInterface() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'menu'>('inventory');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user?.role !== 'employee') return;
    loadData();
    // Set up real-time subscription for orders
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (!user || user.role !== 'employee') {
    return <Navigate to="/employee/signin" />;
  }

  const loadData = async () => {
    await Promise.all([loadInventory(), loadOrders()]);
    setLoading(false);
  };

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category, name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            quantity,
            menu_item:menu_items(name)
          ),
          user:profiles(full_name, student_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const updateInventory = async (id: string, change: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newInventory = Math.max(0, item.inventory + change);
    setItems(items.map(i => 
      i.id === id ? { ...i, inventory: newInventory } : i
    ));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('menu_items')
        .upsert(
          items.map(({ id, inventory, is_available }) => ({
            id,
            inventory,
            is_available,
            updated_at: new Date().toISOString()
          }))
        );

      if (error) throw error;
      toast.success('Inventory updated successfully');
    } catch (error) {
      toast.error('Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order status updated');
      loadOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleAddItem = async () => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          ...newItem,
          inventory: 0,
          is_available: true,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success('Menu item added successfully');
      loadInventory();
      setShowAddForm(false);
      setNewItem({});
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update(editingItem)
        .eq('id', editingItem.id);

      if (error) throw error;
      toast.success('Menu item updated successfully');
      loadInventory();
      setEditingItem(null);
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Menu item deleted successfully');
      loadInventory();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'inventory'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'orders'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'menu'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Menu Management
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          {['Main Course', 'Fruits & Vegetables', 'Drinks'].map(category => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4">{category}</h2>
              <div className="space-y-4">
                {items
                  .filter(item => item.category === category)
                  .map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <div className="text-sm text-gray-500">
                            Prep time: {item.preparation_time} mins
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={item.is_available}
                            onChange={(e) => {
                              setItems(items.map(i =>
                                i.id === item.id
                                  ? { ...i, is_available: e.target.checked }
                                  : i
                              ));
                            }}
                            className="rounded text-orange-500"
                          />
                          <span className="text-sm">Available</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateInventory(item.id, -1)}
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.inventory}
                          </span>
                          <button
                            onClick={() => updateInventory(item.id, 1)}
                            className="p-1 rounded-full hover:bg-gray-200"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {['pending', 'preparing', 'ready', 'completed'].map((status) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4 capitalize">{status} Orders</h2>
              <div className="space-y-4">
                {orders
                  .filter(order => order.status === status)
                  .map(order => (
                    <div
                      key={order.id}
                      className="p-4 bg-gray-50 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            Order #{order.id.slice(0, 8)}
                          </span>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {status !== 'completed' && (
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus['status'])}
                              className="px-3 py-1 rounded border"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div>Customer: {order.user.full_name}</div>
                        <div>Student ID: {order.user.student_id}</div>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.menu_item.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              <Plus className="h-5 w-5" />
              <span>Add Menu Item</span>
            </button>
          </div>

          {['Main Course', 'Fruits & Vegetables', 'Drinks'].map(category => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4">{category}</h2>
              <div className="space-y-4">
                {items
                  .filter(item => item.category === category)
                  .map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-sm text-gray-500">{item.description}</p>
                          <div className="text-sm text-gray-500">
                            Prep time: {item.preparation_time} mins
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Menu Item</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newItem.category || ''}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select category</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                  <option value="Drinks">Drinks</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={newItem.image_url || ''}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preparation Time (mins)</label>
                <input
                  type="number"
                  value={newItem.preparation_time || ''}
                  onChange={(e) => setNewItem({ ...newItem, preparation_time: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Menu Item</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingItem.image_url}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preparation Time (mins)</label>
                <input
                  type="number"
                  value={editingItem.preparation_time}
                  onChange={(e) => setEditingItem({ ...editingItem, preparation_time: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateItem}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}