import { create } from 'zustand';

interface TimeSlot {
  time: string;
  capacity: number;
  available: number;
}

interface Location {
  id: number;
  name: string;
  slots: TimeSlot[];
}

interface ScheduleState {
  locations: Location[];
  selectedLocation: Location | null;
  selectedTime: string | null;
  setSelectedLocation: (location: Location | null) => void;
  setSelectedTime: (time: string | null) => void;
  decrementAvailability: (locationId: number, time: string) => void;
}

// Generate time slots from 11:00 AM to 2:00 PM in 15-minute intervals
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startTime = new Date();
  startTime.setHours(11, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(14, 0, 0);
  
  while (startTime < endTime) {
    slots.push({
      time: startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      capacity: 10,
      available: 10,
    });
    startTime.setMinutes(startTime.getMinutes() + 15);
  }
  
  return slots;
};

export const useScheduleStore = create<ScheduleState>((set) => ({
  locations: [
    {
      id: 1,
      name: 'Main Cafeteria',
      slots: generateTimeSlots(),
    },
    {
      id: 2,
      name: 'Student Center',
      slots: generateTimeSlots(),
    },
    {
      id: 3,
      name: 'Library Café',
      slots: generateTimeSlots(),
    },
  ],
  selectedLocation: null,
  selectedTime: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setSelectedTime: (time) => set({ selectedTime: time }),
  decrementAvailability: (locationId, time) =>
    set((state) => ({
      locations: state.locations.map((location) =>
        location.id === locationId
          ? {
              ...location,
              slots: location.slots.map((slot) =>
                slot.time === time
                  ? { ...slot, available: Math.max(0, slot.available - 1) }
                  : slot
              ),
            }
          : location
      ),
    })),
}));