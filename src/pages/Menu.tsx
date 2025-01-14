import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, X } from 'lucide-react';
import { useCartStore, ItemCategory } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORIES: ItemCategory[] = ['Main Course', 'Fruits & Vegetables', 'Drinks'];

const MENU_ITEMS = [
  // Main Courses
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Fresh beef patty with lettuce and tomato',
    category: 'Main Course' as ItemCategory,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300',
    prepTime: 10,
    price: 0
  },
  {
    id: '2',
    name: 'Grilled Chicken Sandwich',
    description: 'Seasoned grilled chicken sandwich',
    category: 'Main Course' as ItemCategory,
    image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=300',
    prepTime: 12,
    price: 0
  },
  // Fruits & Vegetables
  {
    id: '4',
    name: 'Fresh Apple',
    description: 'Crisp and sweet apple',
    category: 'Fruits & Vegetables' as ItemCategory,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300',
    prepTime: 0,
    price: 0
  },
  {
    id: '5',
    name: 'Carrot Sticks',
    description: 'Fresh cut carrot sticks',
    category: 'Fruits & Vegetables' as ItemCategory,
    image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=300',
    prepTime: 0,
    price: 0
  },
  // Drinks
  {
    id: '6',
    name: 'Water Bottle',
    description: 'Pure spring water',
    category: 'Drinks' as ItemCategory,
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=300',
    prepTime: 0,
    price: 0
  },
  {
    id: '7',
    name: 'Milk',
    description: 'Cold white milk',
    category: 'Drinks' as ItemCategory,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300',
    prepTime: 0,
    price: 0
  }
];

export default function Menu() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('Main Course');
  const [filteredItems, setFilteredItems] = useState(MENU_ITEMS);
  const { items, addItem, removeItem } = useCartStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const filtered = MENU_ITEMS.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
    
    if (filtered.length > 0 && !filtered.some(item => item.category === activeCategory)) {
      setActiveCategory(filtered[0].category);
    }
  }, [searchTerm]);

  if (!user) {
    return <Navigate to="/signin" />;
  }

  const handleItemClick = (item: typeof MENU_ITEMS[0]) => {
    const existingItem = items.find(i => i.id === item.id);
    
    if (existingItem) {
      removeItem(item.id);
      toast.success(`Removed ${item.name}`);
    } else {
      // Check if we already have an item in this category
      const categoryItem = items.find(i => i.category === item.category);
      if (categoryItem) {
        toast.success(`Replaced ${categoryItem.name} with ${item.name}`);
      } else {
        toast.success(`Added ${item.name}`);
      }
      addItem(item);
    }
  };

  const displayedItems = filteredItems.filter(item => 
    searchTerm ? true : item.category === activeCategory
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Today's Menu</h1>
          <div className="relative flex-1 max-w-md ml-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {displayedItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden transform transition-all duration-200 hover:shadow-md hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 bg-orange-100 px-3 py-1 rounded-full text-sm font-medium text-orange-600">
                  {item.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  {item.prepTime > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Prep time: {item.prepTime} mins</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      items.some(i => i.id === item.id)
                        ? 'bg-green-500 text-white hover:bg-red-500'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {items.some(i => i.id === item.id) ? (
                      <>
                        <X className="h-4 w-4" />
                        <span>Remove</span>
                      </>
                    ) : (
                      <span>Select</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}