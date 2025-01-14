import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Preferences {
  preferredLocation: string;
  lunchPeriod: 'A' | 'B';
}

interface PreferencesState extends Preferences {
  setPreferredLocation: (location: string) => void;
  setLunchPeriod: (period: 'A' | 'B') => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      preferredLocation: 'MAIN 1',
      lunchPeriod: 'A',
      setPreferredLocation: (location) =>
        set({ preferredLocation: location }),
      setLunchPeriod: (period) =>
        set({ lunchPeriod: period }),
    }),
    {
      name: 'preferences-storage',
    }
  )
);