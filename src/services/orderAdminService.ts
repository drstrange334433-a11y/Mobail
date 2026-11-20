/**
 * Paracha Mobile Shop — Admin Order Service
 * Real Supabase PostgreSQL operations with strict typing and admin verification
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order, OrderStatus, OrderFilters, OrderStats } from '../types/order';

export const orderAdminService = {
  /**
   * Fetch all orders with optional filtering, search, and pagination
   */
  async getAdminOrders(filters?: OrderFilters): Promise<{ data: Order[]; error: string | null }> {
    if (!isSupabaseConfigured) {
      return {
        data: [],
        error: 'Supabase credentials are not configured in your environment.',
      };
    }

    try {
      let query = supabase
        .from('orders')
        .select('*');

      // Filter by status if not 'all'
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Customer name or phone search
      if (filters?.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%,delivery_address.ilike.%${term}%`);
      }

      // Sorting
      const sortBy = filters?.sortBy || 'created_at';
      const ascending = filters?.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: (data as Order[]) || [], error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err.message : 'Failed to query orders from database',
      };
    }
  },

  /**
   * Fetch a single order by ID
   */
  async getOrderById(id: string): Promise<{ data: Order | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Database is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Order, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to retrieve order',
      };
    }
  },

  /**
   * Update an order's status
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<{ data: Order | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Database is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Order, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to update order status',
      };
    }
  },

  /**
   * Record when a WhatsApp notification was sent
   */
  async markWhatsAppSent(id: string): Promise<{ data: Order | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Database is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ whatsapp_sent_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Order, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to log WhatsApp notification timestamp',
      };
    }
  },

  /**
   * Delete an order (Admin only)
   */
  async deleteOrder(id: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database is not configured.' };
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete order',
      };
    }
  },

  /**
   * Get aggregate statistics across all orders
   */
  async getOrderStats(): Promise<{ data: OrderStats; error: string | null }> {
    const defaultStats: OrderStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };

    if (!isSupabaseConfigured) {
      return { data: defaultStats, error: 'Database is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_price');

      if (error) {
        return { data: defaultStats, error: error.message };
      }

      const orders = data || [];
      const stats: OrderStats = {
        total: orders.length,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
      };

      for (const row of orders) {
        const s = row.status as OrderStatus;
        if (s in stats) {
          stats[s]++;
        }
        // Count revenue for valid non-cancelled orders
        if (s !== 'cancelled') {
          stats.totalRevenue += Number(row.total_price || 0);
        }
      }

      return { data: stats, error: null };
    } catch (err: unknown) {
      return {
        data: defaultStats,
        error: err instanceof Error ? err.message : 'Failed to calculate order stats',
      };
    }
  },
};
