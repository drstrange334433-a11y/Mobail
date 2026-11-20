/**
 * Paracha Mobile Shop — Brand Administration Service
 * Pure Supabase PostgreSQL & Storage operations with strict typing
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { 
  AdminBrandListItem, 
  BrandFormData, 
  BrandFilterParams, 
  BrandUsageCheck 
} from '../types/brand';
import type { Brand } from '../types/database';

export const brandAdminService = {
  /**
   * Fetch all brands for admin listing with search, status filters, and real product counts
   */
  async getAdminBrands(filters: BrandFilterParams = {}): Promise<{ data: AdminBrandListItem[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: new Error('Supabase is not configured.') };
    }

    try {
      let query = supabase
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      // Status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      // Search filter
      if (filters.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.ilike('name', `%${term}%`);
      }

      const { data: rawBrands, error: brandError } = await query;

      if (brandError) {
        return { data: [], error: new Error(brandError.message) };
      }

      const allBrands = (rawBrands as Brand[]) || [];

      // Query product counts per brand
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('brand_id');

      const countsMap: Record<string, number> = {};
      if (!prodError && productsData) {
        for (const p of productsData) {
          if (p.brand_id) {
            countsMap[p.brand_id] = (countsMap[p.brand_id] || 0) + 1;
          }
        }
      }

      const enriched: AdminBrandListItem[] = allBrands.map((b) => ({
        ...b,
        product_count: countsMap[b.id] || 0,
      }));

      return { data: enriched, error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to load brands.'),
      };
    }
  },

  /**
   * Fetch single brand by ID
   */
  async getAdminBrand(id: string): Promise<{ data: Brand | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { data: null, error: new Error(error?.message || 'Brand not found.') };
      }

      return { data: data as Brand, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to query brand.'),
      };
    }
  },

  /**
   * Check if a brand name is already used (excluding current brand during edit)
   */
  async checkBrandNameExists(name: string, excludeId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    let query = supabase
      .from('brands')
      .select('id')
      .ilike('name', name.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;
    return Boolean(data && data.length > 0);
  },

  /**
   * Check if any products are associated with this brand
   */
  async checkBrandUsage(id: string): Promise<BrandUsageCheck> {
    if (!isSupabaseConfigured) {
      return { productCount: 0, canDeleteSafely: true };
    }

    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', id);

      const productCount = count ?? 0;
      return {
        productCount,
        canDeleteSafely: productCount === 0,
      };
    } catch {
      return { productCount: 0, canDeleteSafely: false };
    }
  },

  /**
   * Upload brand logo to `brand-logos` bucket
   */
  async uploadBrandLogo(file: File, brandName: string): Promise<{ url: string | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { url: null, error: new Error('Supabase is not configured.') };
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return {
        url: null,
        error: new Error('Invalid file format. Please upload a PNG, JPG, WEBP, or SVG image.'),
      };
    }

    // Validate size (max 8MB)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        url: null,
        error: new Error('File size exceeds 8MB limit. Please choose a smaller image file.'),
      };
    }

    try {
      const sanitizedBrand = brandName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'brand';
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const filePath = `${sanitizedBrand}/${fileUuid}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError || !uploadData) {
        return { url: null, error: new Error(uploadError?.message || 'Logo upload failed.') };
      }

      const { data: publicUrlData } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(uploadData.path);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: unknown) {
      return {
        url: null,
        error: err instanceof Error ? err : new Error('Failed to upload brand logo.'),
      };
    }
  },

  /**
   * Create a new brand
   */
  async createBrand(
    formData: BrandFormData,
    logoFile?: File | null
  ): Promise<{ brand: Brand | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { brand: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const name = formData.name.trim();

      // Check name uniqueness
      const exists = await this.checkBrandNameExists(name);
      if (exists) {
        return {
          brand: null,
          error: new Error(`Brand "${name}" already exists. Please choose a unique brand name.`),
        };
      }

      let logoUrl = formData.logo_url?.trim() || null;

      // Upload logo if file provided
      if (logoFile) {
        const uploadRes = await this.uploadBrandLogo(logoFile, name);
        if (uploadRes.url) {
          logoUrl = uploadRes.url;
        } else if (uploadRes.error) {
          return { brand: null, error: uploadRes.error };
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from('brands')
        .insert({
          name,
          logo_url: logoUrl,
          is_active: formData.is_active,
          sort_order: Number(formData.sort_order) || 0,
        })
        .select()
        .single();

      if (insertError || !inserted) {
        return {
          brand: null,
          error: new Error(insertError?.message || 'Failed to insert brand record.'),
        };
      }

      return { brand: inserted as Brand, error: null };
    } catch (err: unknown) {
      return {
        brand: null,
        error: err instanceof Error ? err : new Error('An unexpected error occurred while creating brand.'),
      };
    }
  },

  /**
   * Update an existing brand
   */
  async updateBrand(
    brandId: string,
    formData: BrandFormData,
    logoFile?: File | null,
    removeLogo = false
  ): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      const name = formData.name.trim();

      // Check name uniqueness
      const exists = await this.checkBrandNameExists(name, brandId);
      if (exists) {
        return {
          error: new Error(`Brand "${name}" already exists. Please choose a unique brand name.`),
        };
      }

      let logoUrl = removeLogo ? null : formData.logo_url?.trim() || null;

      // Upload new logo if provided
      if (logoFile) {
        const uploadRes = await this.uploadBrandLogo(logoFile, name);
        if (uploadRes.url) {
          logoUrl = uploadRes.url;
        } else if (uploadRes.error) {
          return { error: uploadRes.error };
        }
      }

      const { error: updateError } = await supabase
        .from('brands')
        .update({
          name,
          logo_url: logoUrl,
          is_active: formData.is_active,
          sort_order: Number(formData.sort_order) || 0,
        })
        .eq('id', brandId);

      if (updateError) {
        return { error: new Error(updateError.message) };
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('An unexpected error occurred while updating brand.'),
      };
    }
  },

  /**
   * Delete a brand
   * (delete the DB row first, then try to remove the storage file; never block on cleanup failure)
   */
  async deleteBrand(brandId: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      // Check usage before deletion
      const usage = await this.checkBrandUsage(brandId);
      if (usage.productCount > 0) {
        return {
          error: new Error(
            `This brand is currently linked to ${usage.productCount} product(s). Please move or reassign those products before deleting this brand.`
          ),
        };
      }

      // Read logo_url before DB deletion
      const { data: brandData } = await supabase
        .from('brands')
        .select('logo_url')
        .eq('id', brandId)
        .single();
      const logoUrl = brandData?.logo_url;

      // 1. Delete DB row first
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) {
        return { error: new Error(error.message) };
      }

      // 2. Try to remove the storage file; never block on cleanup failure
      if (logoUrl) {
        try {
          const token = '/brand-logos/';
          const idx = logoUrl.indexOf(token);
          if (idx !== -1) {
            const storagePath = decodeURIComponent(logoUrl.substring(idx + token.length).split('?')[0]);
            await supabase.storage.from('brand-logos').remove([storagePath]);
          }
        } catch (cleanupErr) {
          console.warn('Brand logo storage cleanup non-fatal warning:', cleanupErr);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to delete brand.'),
      };
    }
  },
};
