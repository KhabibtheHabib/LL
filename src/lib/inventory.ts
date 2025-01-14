import { supabase } from './supabase';
import type { MenuItem } from './supabase';

export class InventoryManager {
  private static instance: InventoryManager;
  private cache: Map<string, MenuItem>;
  private subscribers: Set<(items: MenuItem[]) => void>;

  private constructor() {
    this.cache = new Map();
    this.subscribers = new Set();
    this.setupRealtimeSubscription();
  }

  static getInstance(): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager();
    }
    return InventoryManager.instance;
  }

  private setupRealtimeSubscription(): void {
    supabase
      .channel('menu-items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => {
          this.refreshCache();
        }
      )
      .subscribe();
  }

  async getAvailableItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .gt('inventory', 0);

    if (error) throw error;
    return data || [];
  }

  async checkAvailability(itemId: string, quantity: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('inventory, is_available')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    return data.is_available && data.inventory >= quantity;
  }

  async updateInventory(itemId: string, quantityChange: number): Promise<void> {
    const { error } = await supabase.rpc('update_inventory', {
      item_id: itemId,
      quantity_change: quantityChange
    });

    if (error) throw error;
    await this.refreshCache();
  }

  subscribe(callback: (items: MenuItem[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private async refreshCache(): Promise<void> {
    const items = await this.getAvailableItems();
    this.cache.clear();
    items.forEach(item => this.cache.set(item.id, item));
    this.notifySubscribers(items);
  }

  private notifySubscribers(items: MenuItem[]): void {
    this.subscribers.forEach(callback => callback(items));
  }

  async getItemsByCategory(category: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .gt('inventory', 0);

    if (error) throw error;
    return data || [];
  }

  async getPopularItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('popular_items_by_time')
      .select('item_name, order_count')
      .order('order_count', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  }
}