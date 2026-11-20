/**
 * Paracha Mobile Shop — Admin Service
 * Real database aggregation and administrative management queries
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order, Product } from '../types/database';

export interface DashboardStats {
  totalProducts: number | null;
  totalOrders: number | null;
  activeBanners: number | null;
  totalCategories: number | null;
  totalBrands: number | null;
  activeTestimonials: number | null;
  isConfigured: boolean;
  error?: string | null;
}

export const adminService = {
  /**
   * Real database queries for dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    if (!isSupabaseConfigured) {
      return {
        totalProducts: null,
        totalOrders: null,
        activeBanners: null,
        totalCategories: null,
        totalBrands: null,
        activeTestimonials: null,
        isConfigured: false,
        error: 'Supabase credentials not configured in environment',
      };
    }

    try {
      const [productsRes, ordersRes, bannersRes, categoriesRes, brandsRes, testimonialsRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
        supabase.from('testimonials').select('*', { count: 'exact', head: true }),
      ]);

      const error = productsRes.error || ordersRes.error || bannersRes.error || categoriesRes.error || brandsRes.error || testimonialsRes.error;

      return {
        totalProducts: productsRes.count ?? 0,
        totalOrders: ordersRes.count ?? 0,
        activeBanners: bannersRes.count ?? 0,
        totalCategories: categoriesRes.count ?? 0,
        totalBrands: brandsRes.count ?? 0,
        activeTestimonials: testimonialsRes.count ?? 0,
        isConfigured: true,
        error: error ? error.message : null,
      };
    } catch (err: unknown) {
      return {
        totalProducts: null,
        totalOrders: null,
        activeBanners: null,
        totalCategories: null,
        totalBrands: null,
        activeTestimonials: null,
        isConfigured: true,
        error: err instanceof Error ? err.message : 'Failed to query database statistics',
      };
    }
  },

  /**
   * Fetch recent orders for admin overview
   */
  async getRecentOrders(limit = 5): Promise<{ data: Order[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Order[]) || [], error: null };
  },

  /**
   * Fetch recent products for admin overview
   */
  async getRecentProducts(limit = 5): Promise<{ data: Product[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Product[]) || [], error: null };
  },
};
