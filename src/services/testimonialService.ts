/**
 * Paracha Mobile Shop — Public Testimonial Service
 * Real Supabase query for fetching active, verified customer testimonials
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Testimonial } from '../types/testimonial';

export const testimonialService = {
  /**
   * Fetch active testimonials ordered by created_at descending
   */
  async getActiveTestimonials(): Promise<{ data: Testimonial[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error };
      }

      return { data: (data as Testimonial[]) || [], error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to load testimonials'),
      };
    }
  },
};
