import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ItemCategory = 'Main Course' | 'Fruits & Vegetables' | 'Drinks';

interface CartItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  quantity: number;
  image: string;
  prepTime?: number;
}

interface CartState {
  items: CartItem[];
  selectedTimeSlot: any | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setSelectedTimeSlot: (timeSlot: any | null) => void;
  clearCart: () => void;
  total: () => number;
  getTotalPrepTime: () => number;
  getItemByCategory: (category: ItemCategory) => CartItem | undefined;
  getCategoryCount: () => number;
  isCartComplete: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedTimeSlot: null,

      addItem: (item) => set((state) => {
        // Remove any existing item in the same category
        const filteredItems = state.items.filter(i => i.category !== item.category);
        return {
          items: [...filteredItems, { ...item, quantity: 1 }]
        };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      })),

      setSelectedTimeSlot: (timeSlot) => set({ selectedTimeSlot: timeSlot }),

      clearCart: () => set({ items: [], selectedTimeSlot: null }),

      total: () => {
        const state = get();
        return state.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      getTotalPrepTime: () => {
        const state = get();
        return state.items.reduce(
          (max, item) => Math.max(max, item.prepTime || 0),
          0
        );
      },

      getItemByCategory: (category) => {
        const state = get();
        return state.items.find(item => item.category === category);
      },

      getCategoryCount: () => {
        const state = get();
        return state.items.length;
      },

      isCartComplete: () => {
        const state = get();
        const categories: ItemCategory[] = ['Main Course', 'Fruits & Vegetables', 'Drinks'];
        return categories.every(category => 
          state.items.some(item => item.category === category)
        );
      }
    }),
    {
      name: 'cart-storage',
      version: 1,
    }
  )
);