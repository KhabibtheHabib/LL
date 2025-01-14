import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, MapPin, Key, Mail, School, Clock, Bot } from 'lucide-react';
import { useTheme } from '../store/theme';
import { useAuthStore } from '../store/auth';
import { usePreferences } from '../store/preferences';
import { initializeAI } from '../lib/chatbot';
import toast from 'react-hot-toast';

const LOCATIONS = [
  'ESTEM 1',
  'ESTEM 2',
  'MAIN 1',
  'MAIN 2',
  'MAIN 3',
  'MAIN 4',
  'MAIN 5'
];

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { preferredLocation, lunchPeriod, setPreferredLocation, setLunchPeriod } = usePreferences();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Implement password change logic here
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setNewPassword('');
      setCurrentPassword('');
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const handleAPIKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setSavingKey(true);
    try {
      await initializeAI(apiKey);
      toast.success('Claude API key validated and saved successfully');
      setApiKey('');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to validate API key. Please try again.';
      toast.error(errorMessage);
      console.error('Failed to initialize AI:', errorMessage);
    } finally {
      setSavingKey(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Theme Toggle */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-purple-500" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
              <h2 className="text-lg font-semibold">Theme</h2>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </motion.div>

        {/* Claude API Key */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Bot className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Claude API Key</h2>
          </div>
          <form onSubmit={handleAPIKeySubmit} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Claude API key"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingKey || !apiKey.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {savingKey ? (
                <>
                  <span className="animate-spin">⌛</span>
                  <span>Validating...</span>
                </>
              ) : (
                'Save API Key'
              )}
            </button>
          </form>
        </motion.div>

        {/* Location Preference */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Preferred Location</h2>
          </div>
          <select
            value={preferredLocation}
            onChange={(e) => setPreferredLocation(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-orange-500"
          >
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Lunch Period */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Lunch Period</h2>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setLunchPeriod('A')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                lunchPeriod === 'A'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Lunch A
            </button>
            <button
              onClick={() => setLunchPeriod('B')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                lunchPeriod === 'B'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Lunch B
            </button>
          </div>
        </motion.div>

        {/* Student Information */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-4">
            <School className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Student Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                value={user?.studentId || ''}
                disabled
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}