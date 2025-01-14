import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Menu as MenuIcon, Home, ShoppingBag, LayoutDashboard, Settings, LogOut, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import CartButton from './CartButton';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isHomePage = window.location.pathname === '/';

  return (
    <nav className="bg-white/80 backdrop-blur-md fixed w-full top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 blur opacity-50 rounded-full group-hover:opacity-75 transition-opacity" />
              <UtensilsCrossed className="h-8 w-8 text-orange-500 relative" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
              Lineless Lunch
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {isHomePage && !user && (
              <Link
                to="/signin"
                className="bg-gradient-to-r from-orange-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300"
              >
                Sign In
              </Link>
            )}
            
            {user && (
              <>
                <Link to="/" className="p-2 text-gray-700 hover:text-orange-500 transition-colors">
                  <Home className="h-6 w-6" />
                </Link>
                <Link to="/menu" className="p-2 text-gray-700 hover:text-orange-500 transition-colors">
                  <UtensilsCrossed className="h-6 w-6" />
                </Link>
                <Link to="/dashboard" className="p-2 text-gray-700 hover:text-orange-500 transition-colors">
                  <LayoutDashboard className="h-6 w-6" />
                </Link>
                <Link to="/settings" className="p-2 text-gray-700 hover:text-orange-500 transition-colors">
                  <Settings className="h-6 w-6" />
                </Link>
                <CartButton />
                <button
                  className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                  onClick={() => {
                    signOut();
                    navigate('/signin');
                  }}
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-orange-500"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 inset-x-0 bg-white shadow-lg"
          >
            <div className="p-4 space-y-4">
              {user ? (
                <>
                  <Link
                    to="/menu"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UtensilsCrossed className="h-5 w-5" />
                    <span>Menu</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      navigate('/signin');
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/signin"
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}