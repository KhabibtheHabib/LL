import { supabase } from './supabase';
import type { TimeSlot } from './supabase';

interface QueueSlot {
  locationId: string;
  time: string;
  available: number;
  total: number;
}

export class QueueManager {
  private static instance: QueueManager;
  private timeSlots: Map<string, QueueSlot[]>;

  private constructor() {
    this.timeSlots = new Map();
  }

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  async initializeTimeSlots(lunchPeriod: 'A' | 'B'): Promise<void> {
    const startTime = lunchPeriod === 'A' ? '11:00' : '12:00';
    const locations = await this.getLocations();

    for (const location of locations) {
      const slots: QueueSlot[] = [];
      let currentTime = new Date(`2000-01-01 ${startTime}`);
      
      // Create 5-minute slots for 1 hour
      for (let i = 0; i < 12; i++) {
        slots.push({
          locationId: location.id,
          time: currentTime.toTimeString().slice(0, 5),
          available: 10, // Maximum orders per 5-minute slot
          total: 10
        });
        currentTime.setMinutes(currentTime.getMinutes() + 5);
      }
      
      this.timeSlots.set(location.id, slots);
    }
  }

  async findOptimalSlot(locationPreference?: string): Promise<TimeSlot | null> {
    const locations = locationPreference 
      ? [await this.getLocation(locationPreference)]
      : await this.getLocations();

    let bestSlot: TimeSlot | null = null;
    let minWaitTime = Infinity;

    for (const location of locations) {
      const slots = this.timeSlots.get(location.id) || [];
      
      for (const slot of slots) {
        if (slot.available > 0) {
          const waitTime = this.calculateWaitTime(slot);
          if (waitTime < minWaitTime) {
            minWaitTime = waitTime;
            bestSlot = {
              id: `${location.id}-${slot.time}`,
              locationId: location.id,
              time: slot.time,
              available: slot.available,
              capacity: slot.total
            };
          }
        }
      }
    }

    return bestSlot;
  }

  private calculateWaitTime(slot: QueueSlot): number {
    const occupancy = 1 - (slot.available / slot.total);
    const baseWaitTime = 5; // 5 minutes per slot
    return baseWaitTime * (1 + occupancy);
  }

  async reserveSlot(slotId: string): Promise<boolean> {
    const [locationId, time] = slotId.split('-');
    const slots = this.timeSlots.get(locationId);
    if (!slots) return false;

    const slot = slots.find(s => s.time === time);
    if (!slot || slot.available === 0) return false;

    slot.available--;
    return true;
  }

  private async getLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  private async getLocation(id: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}