import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FirstTimeSettingsGuide() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenSettingsGuide');
    if (!hasSeenGuide) {
      setShow(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('hasSeenSettingsGuide', 'true');
    setShow(false);
    navigate('/settings');
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Welcome to Lineless Lunch!</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Let's start by setting up your preferences. Click the button below to customize your experience.
          </p>
          <button
            onClick={handleComplete}
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Configure Settings
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}