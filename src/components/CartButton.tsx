import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';

export default function CartButton() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);

  return (
    <button
      onClick={() => navigate('/cart')}
      className="relative p-2 text-gray-700 hover:text-orange-500 transition-colors"
    >
      <ShoppingBag className="h-6 w-6" />
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-purple-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse">
          {items.length}
        </span>
      )}
    </button>
  );
}