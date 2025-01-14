import { supabase } from './supabase';

export interface Analytics {
  totalOrders: number;
  completedOrders: number;
  averageWaitTime: number;
  favoriteItems: Array<{
    name: string;
    orderCount: number;
  }>;
  timeSaved: number;
  ordersByDay: Array<{
    date: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

export class AnalyticsManager {
  private static instance: AnalyticsManager;

  private constructor() {}

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  async getUserAnalytics(userId: string): Promise<Analytics> {
    const { data, error } = await supabase.rpc('get_user_analytics', {
      p_user_id: userId
    });

    if (error) throw error;

    const ordersByDay = await this.getOrdersByDay(userId);
    const peakHours = await this.getPeakHours(userId);

    return {
      ...data,
      ordersByDay,
      peakHours
    };
  }

  private async getOrdersByDay(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const ordersByDay = data.reduce((acc: Record<string, number>, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(ordersByDay).map(([date, count]) => ({
      date,
      count
    }));
  }

  private async getPeakHours(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const hourCounts = data.reduce((acc: Record<number, number>, order) => {
      const hour = new Date(order.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }));
  }

  async getSystemAnalytics(): Promise<{
    totalOrders: number;
    averagePreparationTime: number;
    popularItems: Array<{ name: string; count: number }>;
  }> {
    const { data, error } = await supabase.rpc('get_system_analytics');

    if (error) throw error;
    return data;
  }

  async trackOrderCompletion(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('order_analytics')
      .insert([{ order_id: orderId, completed_at: new Date().toISOString() }]);

    if (error) throw error;
  }
}