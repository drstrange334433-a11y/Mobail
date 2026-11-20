/**
 * Paracha Mobile Shop — Banner Administration Service
 * Pure Supabase PostgreSQL & Storage operations with strict typing
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { 
  AdminBannerListItem, 
  BannerFormData, 
  BannerFilterParams 
} from '../types/banner';
import type { Banner } from '../types/database';

export const bannerAdminService = {
  /**
   * Fetch all banners for admin listing with search and status filters
   */
  async getAdminBanners(filters: BannerFilterParams = {}): Promise<{ data: AdminBannerListItem[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: new Error('Supabase is not configured.') };
    }

    try {
      let query = supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      // Status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      // Search filter
      if (filters.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`title_en.ilike.%${term}%,title_ur.ilike.%${term}%,subtitle_en.ilike.%${term}%,subtitle_ur.ilike.%${term}%`);
      }

      const { data: rawBanners, error: bannerError } = await query;

      if (bannerError) {
        return { data: [], error: new Error(bannerError.message) };
      }

      return { data: (rawBanners as Banner[]) || [], error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Unexpected error loading banners.'),
      };
    }
  },

  /**
   * Fetch single banner by ID for edit form
   */
  async getBannerById(id: string): Promise<{ banner: Banner | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { banner: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { banner: null, error: new Error(error.message) };
      }

      return { banner: data as Banner, error: null };
    } catch (err: unknown) {
      return {
        banner: null,
        error: err instanceof Error ? err : new Error('Failed to retrieve banner details.'),
      };
    }
  },

  /**
   * Upload banner image to Supabase Storage bucket ('banners')
   * Max 5MB, JPG/PNG/WEBP
   */
  async uploadBannerImage(file: File): Promise<{ url: string | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { url: null, error: new Error('Supabase is not configured.') };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        url: null,
        error: new Error('Unsupported image format. Please upload JPG, PNG, or WEBP image.'),
      };
    }

    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_SIZE) {
      return {
        url: null,
        error: new Error('Image size exceeds 8MB limit. Please compress or select a smaller image.'),
      };
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const filePath = `hero/${fileUuid}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError || !uploadData) {
        return { url: null, error: new Error(uploadError?.message || 'Banner image upload failed.') };
      }

      const { data: publicUrlData } = supabase.storage
        .from('banners')
        .getPublicUrl(uploadData.path);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: unknown) {
      return {
        url: null,
        error: err instanceof Error ? err : new Error('Failed to upload banner image.'),
      };
    }
  },

  /**
   * Create a new banner record
   */
  async createBanner(
    formData: BannerFormData,
    imageFile?: File | null
  ): Promise<{ banner: Banner | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { banner: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const title_en = formData.title_en.trim();
      const title_ur = formData.title_ur.trim();

      if (!title_en) {
        return { banner: null, error: new Error('English title is required.') };
      }
      if (!title_ur) {
        return { banner: null, error: new Error('Urdu title is required.') };
      }

      let imageUrl = formData.image_url?.trim() || '';

      // Upload image if file provided
      if (imageFile) {
        const uploadRes = await this.uploadBannerImage(imageFile);
        if (uploadRes.url) {
          imageUrl = uploadRes.url;
        } else if (uploadRes.error) {
          return { banner: null, error: uploadRes.error };
        }
      }

      if (!imageUrl) {
        return { banner: null, error: new Error('Banner image is required. Please upload or specify an image.') };
      }

      const insertPayload = {
        title_en,
        title_ur,
        subtitle_en: formData.subtitle_en.trim() || null,
        subtitle_ur: formData.subtitle_ur.trim() || null,
        button_text_en: formData.button_text_en.trim() || null,
        button_text_ur: formData.button_text_ur.trim() || null,
        button_link: formData.button_link.trim() || null,
        image_url: imageUrl,
        sort_order: Number(formData.sort_order) || 0,
        is_active: formData.is_active,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('banners')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError || !inserted) {
        return { banner: null, error: new Error(insertError?.message || 'Failed to create banner.') };
      }

      return { banner: inserted as Banner, error: null };
    } catch (err: unknown) {
      return {
        banner: null,
        error: err instanceof Error ? err : new Error('Unexpected error creating banner.'),
      };
    }
  },

  /**
   * Update an existing banner record
   */
  async updateBanner(
    id: string,
    formData: BannerFormData,
    imageFile?: File | null
  ): Promise<{ banner: Banner | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { banner: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const title_en = formData.title_en.trim();
      const title_ur = formData.title_ur.trim();

      if (!title_en) {
        return { banner: null, error: new Error('English title is required.') };
      }
      if (!title_ur) {
        return { banner: null, error: new Error('Urdu title is required.') };
      }

      let imageUrl = formData.image_url?.trim() || '';

      // Upload image if new file provided
      if (imageFile) {
        const uploadRes = await this.uploadBannerImage(imageFile);
        if (uploadRes.url) {
          imageUrl = uploadRes.url;
        } else if (uploadRes.error) {
          return { banner: null, error: uploadRes.error };
        }
      }

      if (!imageUrl) {
        return { banner: null, error: new Error('Banner image is required. Please upload or specify an image.') };
      }

      const updatePayload = {
        title_en,
        title_ur,
        subtitle_en: formData.subtitle_en.trim() || null,
        subtitle_ur: formData.subtitle_ur.trim() || null,
        button_text_en: formData.button_text_en.trim() || null,
        button_text_ur: formData.button_text_ur.trim() || null,
        button_link: formData.button_link.trim() || null,
        image_url: imageUrl,
        sort_order: Number(formData.sort_order) || 0,
        is_active: formData.is_active,
      };

      const { data: updated, error: updateError } = await supabase
        .from('banners')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateError || !updated) {
        return { banner: null, error: new Error(updateError?.message || 'Failed to update banner.') };
      }

      return { banner: updated as Banner, error: null };
    } catch (err: unknown) {
      return {
        banner: null,
        error: err instanceof Error ? err : new Error('Unexpected error updating banner.'),
      };
    }
  },

  /**
   * Delete a banner record
   * (delete the DB row first, then try to remove the storage file; never block on cleanup failure)
   */
  async deleteBanner(id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: new Error('Supabase is not configured.') };
    }

    try {
      // Read image_url before DB deletion
      const { data: bannerData } = await supabase
        .from('banners')
        .select('image_url')
        .eq('id', id)
        .single();
      const imageUrl = bannerData?.image_url;

      // 1. Delete DB row first
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      // 2. Try to remove the storage file; never block on cleanup failure
      if (imageUrl) {
        try {
          const token = '/banners/';
          const idx = imageUrl.indexOf(token);
          if (idx !== -1) {
            const storagePath = decodeURIComponent(imageUrl.substring(idx + token.length).split('?')[0]);
            await supabase.storage.from('banners').remove([storagePath]);
          }
        } catch (cleanupErr) {
          console.warn('Banner image storage cleanup non-fatal warning:', cleanupErr);
        }
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to delete banner.'),
      };
    }
  },

  /**
   * Toggle active status directly
   */
  async toggleBannerStatus(id: string, currentStatus: boolean): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: new Error('Supabase is not configured.') };
    }

    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err : new Error('Failed to update banner status.'),
      };
    }
  }
};
