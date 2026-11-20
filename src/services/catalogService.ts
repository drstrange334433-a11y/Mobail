/**
 * Paracha Mobile Shop — Catalog Service
 * Real database queries for public catalog data
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Category, Brand, Product, ProductImage, Banner, Testimonial, Setting } from '../types/database';
import { getProductImageUrl } from '../utils/productImages';

export type CatalogProduct = Product & {
  product_images?: ProductImage[];
  primary_image_url?: string;
  categories?: { name_en: string; name_ur: string } | null;
  brands?: { name: string; logo_url: string | null } | null;
};

export const catalogService = {
  /**
   * Fetch active categories sorted by sort_order
   */
  async getCategories(): Promise<{ data: Category[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Category[]) || [], error: null };
  },

  /**
   * Fetch active brands sorted by sort_order
   */
  async getBrands(): Promise<{ data: Brand[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Brand[]) || [], error: null };
  },

  /**
   * Fetch active banners
   */
  async getBanners(): Promise<{ data: Banner[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Banner[]) || [], error: null };
  },

  /**
   * Fetch featured active products with product_images relation
   */
  async getFeaturedProducts(limit = 8): Promise<{ data: CatalogProduct[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name_en, name_ur, slug),
          brands:brand_id (name, logo_url),
          product_images (id, image_url, sort_order, is_primary)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error };
      }

      const products: CatalogProduct[] = ((data as unknown as CatalogProduct[]) || []).map((p) => ({
        ...p,
        primary_image_url: getProductImageUrl(p),
      }));

      return { data: products, error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to load featured products.'),
      };
    }
  },

  /**
   * Fetch active catalog products with optional filters
   */
  async getProducts(params?: {
    condition?: 'new' | 'used';
    categorySlug?: string;
    brandId?: string;
    limit?: number;
  }): Promise<{ data: CatalogProduct[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name_en, name_ur, slug),
          brands:brand_id (name, logo_url),
          product_images (id, image_url, sort_order, is_primary)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (params?.condition) {
        query = query.eq('condition', params.condition);
      }

      if (params?.brandId) {
        query = query.eq('brand_id', params.brandId);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error };
      }

      let items = (data as unknown as CatalogProduct[]) || [];

      if (params?.categorySlug) {
        items = items.filter(
          (p) => (p as unknown as { categories?: { slug?: string } })?.categories?.slug === params.categorySlug
        );
      }

      const products: CatalogProduct[] = items.map((p) => ({
        ...p,
        primary_image_url: getProductImageUrl(p),
      }));

      return { data: products, error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to load catalog products.'),
      };
    }
  },

  /**
   * Fetch single product by ID with full relations including images and variants
   */
  async getProductById(id: string): Promise<{ data: (CatalogProduct & { product_variants?: unknown[] }) | null; error: Error | null }> {
    if (!isSupabaseConfigured || !id) {
      return { data: null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (*),
          brands:brand_id (*),
          product_images (id, image_url, sort_order, is_primary),
          product_variants (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { data: null, error: error ? new Error(error.message) : null };
      }

      const product = data as unknown as CatalogProduct;
      return {
        data: {
          ...product,
          primary_image_url: getProductImageUrl(product),
        },
        error: null,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to load product details.'),
      };
    }
  },

  /**
   * Fetch public settings
   */
  async getSettings(): Promise<{ data: Record<string, string>; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: {}, error: null };
    }

    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) {
      return { data: {}, error };
    }

    const settingsMap: Record<string, string> = {};
    if (data) {
      for (const item of data as Setting[]) {
        if (item.key && item.value) {
          settingsMap[item.key] = item.value;
        }
      }
    }
    return { data: settingsMap, error: null };
  },

  /**
   * Fetch active testimonials
   */
  async getTestimonials(): Promise<{ data: Testimonial[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true);

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Testimonial[]) || [], error: null };
  },
};
