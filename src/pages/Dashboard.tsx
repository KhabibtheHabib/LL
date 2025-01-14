import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Package, Calendar, MapPin, Settings, School } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getUserOrders, getProfile } from '../lib/supabase';
import { demoOrderHistory, demoProfile } from '../lib/demo-data';
import toast from 'react-hot-toast';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('current');
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const [timeSaved, setTimeSaved] = useState(0);
  const [timeSavedData, setTimeSavedData] = useState<Array<{ date: string; minutes: number }>>([]);
  const [nutritionData] = useState<Array<{ name: string; value: number }>>([
    { name: 'Protein', value: 30 },
    { name: 'Carbs', value: 40 },
    { name: 'Fats', value: 20 },
    { name: 'Fiber', value: 10 }
  ]);

  const generateTimeSavedData = (ordersData: any[]) => {
    const completedOrders = ordersData.filter(order => order.status === 'completed');
    let runningTotal = 0;
    const sortedOrders = [...completedOrders].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const data = sortedOrders.map(order => {
      runningTotal += 15; // 15 minutes saved per order
      return {
        date: format(new Date(order.created_at), 'MMM d'),
        minutes: runningTotal
      };
    });

    setTimeSavedData(data);
    setTimeSaved(runningTotal);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          let ordersData, profileData;
          if (user.isDemo) {
            const demoOrders = localStorage.getItem('demo_orders');
            // Combine current orders from localStorage with demo history
            ordersData = [
              ...(demoOrders ? JSON.parse(demoOrders) : []),
              ...demoOrderHistory
            ];
            profileData = demoProfile;
          } else {
            [ordersData, profileData] = await Promise.all([
              getUserOrders(user.id),
              getProfile(user.id)
            ]);
          }
          setOrders(ordersData || []);
          setProfile(profileData);
          generateTimeSavedData(ordersData);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const currentOrders = orders.filter(order => order?.status !== 'completed') || [];
  const pastOrders = orders.filter(order => order?.status === 'completed') || [];

  const getNextPickup = () => {
    if (!currentOrders.length || !currentOrders[0]?.time_slot) return null;
    
    const nextOrder = currentOrders[0];
    return {
      date: nextOrder.time_slot.date,
      time: nextOrder.time_slot.time,
      location: nextOrder.time_slot.location?.name
    };
  };

  const nextPickup = getNextPickup();

  return (
    <div className="max-w-6xl mx-auto">
      {user?.isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You're currently in demo mode. This is a simulation with sample data.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        My Dashboard
      </motion.h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Next Pickup</h3>
            <Calendar className="h-5 w-5 text-orange-500" />
          </div>
          {nextPickup ? (
            <div>
              <p className="text-2xl font-bold mb-2">
                {format(new Date(nextPickup.date), 'MMM d')}
              </p>
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>{nextPickup.time}</span>
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{nextPickup.location}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming pickups</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Student ID</h3>
            <School className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-gray-600 mb-2">{profile?.email}</p>
          <p className="text-gray-600">{profile?.full_name || 'Name not set'}</p>
          {user?.isDemo && (
            <p className="text-sm text-orange-600 mt-2">Demo Account</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Time Saved</h3>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold">{timeSaved} minutes</p>
          <p className="text-gray-600">This semester</p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-6 h-[400px]"
        >
          <h3 className="font-semibold mb-4">Nutritional Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nutritionData}
                  cx={180}
                  cy={140}
                  labelLine={false}
                  label={({ name, percent, x, y, midAngle, cx }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 100;
                    const labelX = x + (radius + 30) * Math.cos(-midAngle * RADIAN);
                    const labelY = y + (radius + 30) * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={labelX}
                        y={labelY}
                        fill="#666"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {`${name}: ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {nutritionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm p-6 h-[400px]"
        >
          <h3 className="font-semibold mb-4">Time Saved History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSavedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#FF6B6B" 
                  name="Minutes Saved"
                  strokeWidth={2}
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{
                    paddingLeft: '20px'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="bg-white rounded-xl shadow-sm p-6 w-[207%] -translate-x-1">
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'current'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('current')}
            >
              Current Orders
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'past'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('past')}
            >
              Order History
            </button>
          </div>

          <div className="space-y-4">
            {(activeTab === 'current' ? currentOrders : pastOrders).map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-6 hover:border-orange-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Items</h4>
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="text-sm">
                        {item.quantity}x {item.menu_item?.name}
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Pickup Details</h4>
                    <div className="text-sm">
                      {order.time_slot?.date && format(new Date(order.time_slot.date), 'MMM d, yyyy')}
                      <br />
                      {order.time_slot?.time} at {order.time_slot?.location?.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(activeTab === 'current' ? currentOrders : pastOrders).length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No {activeTab} orders found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}