import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';
import CartPage from './pages/CartPage';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import AISparkle from './components/AISparkle';
import { useAuthStore } from './store/auth';
import { useTheme } from './store/theme';
import { supabase } from './lib/supabase';
import './styles/animations.css';

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <Router>
      <div className={`min-h-screen bg-gray-50 dark:bg-dark transition-colors duration-300 ${theme}`}>
        {/* Add padding-top to account for fixed navbar */}
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-8 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        {user && <AISparkle />}
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}