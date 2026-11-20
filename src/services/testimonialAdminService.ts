/**
 * Paracha Mobile Shop — Admin Testimonial Service
 * Real Supabase PostgreSQL operations with strict typing and admin verification
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Testimonial, Database } from '../types/database';
import type { 
  AdminTestimonialListItem, 
  TestimonialFormData, 
  TestimonialFilterParams 
} from '../types/testimonial';

export const testimonialAdminService = {
  /**
   * Fetch all testimonials for admin table with optional filters
   */
  async getAdminTestimonials(
    filters?: TestimonialFilterParams
  ): Promise<{ data: AdminTestimonialListItem[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      let query = supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (filters?.rating !== undefined && filters?.rating !== 'all') {
        query = query.eq('rating', filters.rating);
      }

      if (filters?.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(
          `customer_name.ilike.%${term}%,review_en.ilike.%${term}%,review_ur.ilike.%${term}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: new Error(error.message) };
      }

      return { data: (data as AdminTestimonialListItem[]) || [], error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to query testimonials table'),
      };
    }
  },

  /**
   * Fetch a single testimonial by ID for editing
   */
  async getTestimonialById(
    id: string
  ): Promise<{ testimonial: Testimonial | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { testimonial: null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return { testimonial: null, error: new Error(error.message) };
      }

      return { testimonial: (data as Testimonial) || null, error: null };
    } catch (err: unknown) {
      return {
        testimonial: null,
        error: err instanceof Error ? err : new Error('Failed to get testimonial'),
      };
    }
  },

  /**
   * Create a new testimonial record in database
   */
  async createTestimonial(
    data: TestimonialFormData
  ): Promise<{ testimonial: Testimonial | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { testimonial: null, error: new Error('Supabase is not configured') };
    }

    try {
      const payload = {
        customer_name: data.customer_name.trim(),
        review_en: data.review_en.trim() || null,
        review_ur: data.review_ur.trim() || null,
        rating: Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5))),
        is_active: data.is_active,
      };

      const { data: inserted, error } = await supabase
        .from('testimonials')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { testimonial: null, error: new Error(error.message) };
      }

      return { testimonial: inserted as Testimonial, error: null };
    } catch (err: unknown) {
      return {
        testimonial: null,
        error: err instanceof Error ? err : new Error('Failed to create testimonial'),
      };
    }
  },

  /**
   * Update an existing testimonial record
   */
  async updateTestimonial(
    id: string,
    data: Partial<TestimonialFormData>
  ): Promise<{ testimonial: Testimonial | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { testimonial: null, error: new Error('Supabase is not configured') };
    }

    try {
      const payload: Database['public']['Tables']['testimonials']['Update'] = {};

      if (data.customer_name !== undefined) {
        payload.customer_name = data.customer_name.trim();
      }
      if (data.review_en !== undefined) {
        payload.review_en = data.review_en.trim() || null;
      }
      if (data.review_ur !== undefined) {
        payload.review_ur = data.review_ur.trim() || null;
      }
      if (data.rating !== undefined) {
        payload.rating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5)));
      }
      if (data.is_active !== undefined) {
        payload.is_active = data.is_active;
      }

      const { data: updated, error } = await supabase
        .from('testimonials')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { testimonial: null, error: new Error(error.message) };
      }

      return { testimonial: updated as Testimonial, error: null };
    } catch (err: unknown) {
      return {
        testimonial: null,
        error: err instanceof Error ? err : new Error('Failed to update testimonial'),
      };
    }
  },

  /**
   * Toggle active status directly
   */
  async toggleActiveStatus(
    id: string,
    currentStatus: boolean
  ): Promise<{ testimonial: Testimonial | null; error: Error | null }> {
    return this.updateTestimonial(id, { is_active: !currentStatus });
  },

  /**
   * Delete testimonial permanently
   */
  async deleteTestimonial(id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to delete testimonial'),
      };
    }
  },
};
