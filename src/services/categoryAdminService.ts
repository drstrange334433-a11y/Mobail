/**
 * Paracha Mobile Shop — Category Administration Service
 * Pure Supabase PostgreSQL & Storage operations with strict typing
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { 
  AdminCategoryListItem, 
  CategoryFormData, 
  CategoryFilterParams, 
  CategoryUsageCheck 
} from '../types/category';
import type { Category } from '../types/database';

export const categoryAdminService = {
  /**
   * Fetch all categories for the Admin categories list with parent info and product counts
   */
  async getAdminCategories(filters: CategoryFilterParams = {}): Promise<{ data: AdminCategoryListItem[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: new Error('Supabase is not configured.') };
    }

    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      // Apply search filter (name_en, name_ur, or slug)
      if (filters.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`name_en.ilike.%${term}%,name_ur.ilike.%${term}%,slug.ilike.%${term}%`);
      }

      const { data: rawCategories, error: catError } = await query;

      if (catError) {
        return { data: [], error: new Error(catError.message) };
      }

      const allCategories = (rawCategories as Category[]) || [];

      // Fetch product counts for each category
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('category_id');

      const productCountsMap: Record<string, number> = {};
      if (!prodError && productsData) {
        for (const p of productsData) {
          if (p.category_id) {
            productCountsMap[p.category_id] = (productCountsMap[p.category_id] || 0) + 1;
          }
        }
      }

      // Build categories map for fast parent lookup
      const categoryMap = new Map<string, Category>();
      for (const cat of allCategories) {
        categoryMap.set(cat.id, cat);
      }

      // Calculate children counts
      const childrenCountMap: Record<string, number> = {};
      for (const cat of allCategories) {
        if (cat.parent_id) {
          childrenCountMap[cat.parent_id] = (childrenCountMap[cat.parent_id] || 0) + 1;
        }
      }

      // Enrich with parent details and counts
      const enriched: AdminCategoryListItem[] = allCategories.map((cat) => {
        const parent = cat.parent_id ? categoryMap.get(cat.parent_id) : null;
        return {
          ...cat,
          parent: parent ? { id: parent.id, name_en: parent.name_en, name_ur: parent.name_ur } : null,
          product_count: productCountsMap[cat.id] || 0,
          children_count: childrenCountMap[cat.id] || 0,
        };
      });

      return { data: enriched, error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to load categories.'),
      };
    }
  },

  /**
   * Fetch single category by ID
   */
  async getAdminCategory(id: string): Promise<{ data: Category | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { data: null, error: new Error(error?.message || 'Category not found.') };
      }

      return { data: data as Category, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to query category.'),
      };
    }
  },

  /**
   * Get active categories for parent category dropdown, excluding current category and descendants
   */
  async getPotentialParents(excludeCategoryId?: string): Promise<{ data: Category[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: new Error('Supabase is not configured.') };
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        return { data: [], error: new Error(error.message) };
      }

      let categories = (data as Category[]) || [];

      if (excludeCategoryId) {
        // Exclude the category itself to prevent direct self-parenting
        const excludedIds = new Set<string>([excludeCategoryId]);

        // Also recursively exclude all its descendants to prevent circular loops
        let foundNew = true;
        while (foundNew) {
          foundNew = false;
          for (const cat of categories) {
            if (cat.parent_id && excludedIds.has(cat.parent_id) && !excludedIds.has(cat.id)) {
              excludedIds.add(cat.id);
              foundNew = true;
            }
          }
        }

        categories = categories.filter((c) => !excludedIds.has(c.id));
      }

      return { data: categories, error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to load parent category options.'),
      };
    }
  },

  /**
   * Check if a slug is already taken (excluding a specific category during update)
   */
  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    let query = supabase
      .from('categories')
      .select('id')
      .ilike('slug', slug.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;
    return Boolean(data && data.length > 0);
  },

  /**
   * Check category usage: returns counts of associated products and child categories
   */
  async checkCategoryUsage(id: string): Promise<CategoryUsageCheck> {
    if (!isSupabaseConfigured) {
      return { productCount: 0, childCount: 0, canDeleteSafely: true };
    }

    try {
      const [productsRes, childrenRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', id),
        supabase.from('categories').select('*', { count: 'exact', head: true }).eq('parent_id', id),
      ]);

      const productCount = productsRes.count ?? 0;
      const childCount = childrenRes.count ?? 0;

      return {
        productCount,
        childCount,
        canDeleteSafely: productCount === 0 && childCount === 0,
      };
    } catch {
      return { productCount: 0, childCount: 0, canDeleteSafely: false };
    }
  },

  /**
   * Upload category icon to `category-icons` bucket
   * Allowed types: jpeg, png, webp, svg (max 5MB)
   * Unique filename: uuid + extension
   * Saves getPublicUrl() in category.icon_url
   */
  async uploadCategoryIcon(file: File, categorySlug: string): Promise<{ url: string | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { url: null, error: new Error('Supabase is not configured.') };
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return { url: null, error: new Error('Invalid file type. Allowed formats: PNG, JPEG, WebP, SVG.') };
    }

    if (file.size > 8 * 1024 * 1024) {
      return { url: null, error: new Error('Icon image exceeds 8MB size limit.') };
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const filePath = `${categorySlug}/${fileUuid}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError || !uploadData) {
        return { url: null, error: new Error(uploadError?.message || 'Icon upload failed.') };
      }

      const { data: publicUrlData } = supabase.storage
        .from('category-icons')
        .getPublicUrl(uploadData.path);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: unknown) {
      return {
        url: null,
        error: err instanceof Error ? err : new Error('Failed to upload category icon.'),
      };
    }
  },

  /**
   * Create a new category
   */
  async createCategory(
    formData: CategoryFormData,
    iconFile?: File | null
  ): Promise<{ category: Category | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { category: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const slug = formData.slug.trim().toLowerCase();

      // Check slug uniqueness
      const slugExists = await this.checkSlugExists(slug);
      if (slugExists) {
        return {
          category: null,
          error: new Error(`Slug "${slug}" is already in use by another category. Please choose a unique slug.`),
        };
      }

      let iconUrl = formData.icon_url?.trim() || null;

      // Upload icon if file provided
      if (iconFile) {
        const uploadRes = await this.uploadCategoryIcon(iconFile, slug);
        if (uploadRes.url) {
          iconUrl = uploadRes.url;
        } else if (uploadRes.error) {
          console.warn('Icon upload failed, proceeding without icon:', uploadRes.error);
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from('categories')
        .insert({
          name_en: formData.name_en.trim(),
          name_ur: formData.name_ur.trim() || formData.name_en.trim(),
          slug,
          icon_url: iconUrl,
          parent_id: formData.parent_id || null,
          is_active: formData.is_active,
          sort_order: Number(formData.sort_order) || 0,
        })
        .select()
        .single();

      if (insertError || !inserted) {
        return {
          category: null,
          error: new Error(insertError?.message || 'Failed to insert category record.'),
        };
      }

      return { category: inserted as Category, error: null };
    } catch (err: unknown) {
      return {
        category: null,
        error: err instanceof Error ? err : new Error('An unexpected error occurred while creating category.'),
      };
    }
  },

  /**
   * Update an existing category
   */
  async updateCategory(
    categoryId: string,
    formData: CategoryFormData,
    iconFile?: File | null,
    removeIcon = false
  ): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      // Prevent self-parenting
      if (formData.parent_id === categoryId) {
        return { error: new Error('A category cannot select itself as its own parent category.') };
      }

      const slug = formData.slug.trim().toLowerCase();

      // Check slug uniqueness
      const slugExists = await this.checkSlugExists(slug, categoryId);
      if (slugExists) {
        return {
          error: new Error(`Slug "${slug}" is already in use by another category. Please choose a unique slug.`),
        };
      }

      let iconUrl = removeIcon ? null : formData.icon_url?.trim() || null;

      // Upload new icon file if provided
      if (iconFile) {
        const uploadRes = await this.uploadCategoryIcon(iconFile, slug);
        if (uploadRes.url) {
          iconUrl = uploadRes.url;
        }
      }

      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name_en: formData.name_en.trim(),
          name_ur: formData.name_ur.trim() || formData.name_en.trim(),
          slug,
          icon_url: iconUrl,
          parent_id: formData.parent_id || null,
          is_active: formData.is_active,
          sort_order: Number(formData.sort_order) || 0,
        })
        .eq('id', categoryId);

      if (updateError) {
        return { error: new Error(updateError.message) };
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('An unexpected error occurred while updating category.'),
      };
    }
  },

  /**
   * Delete a category
   * (delete the DB row first, then try to remove the storage file; never block on cleanup failure)
   */
  async deleteCategory(categoryId: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      // Check usage before deletion
      const usage = await this.checkCategoryUsage(categoryId);
      if (usage.productCount > 0) {
        return {
          error: new Error(
            `This category contains ${usage.productCount} product(s). Please move or reassign those products before deleting this category.`
          ),
        };
      }

      if (usage.childCount > 0) {
        return {
          error: new Error(
            `This category has ${usage.childCount} sub-category(ies). Please reassign or delete sub-categories first.`
          ),
        };
      }

      // Read icon_url before row deletion
      const { data: catData } = await supabase
        .from('categories')
        .select('icon_url')
        .eq('id', categoryId)
        .single();
      const iconUrl = catData?.icon_url;

      // 1. Delete DB row first
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        return { error: new Error(error.message) };
      }

      // 2. Try to remove the storage file; never block on cleanup failure
      if (iconUrl) {
        try {
          const token = '/category-icons/';
          const idx = iconUrl.indexOf(token);
          if (idx !== -1) {
            const storagePath = decodeURIComponent(iconUrl.substring(idx + token.length).split('?')[0]);
            await supabase.storage.from('category-icons').remove([storagePath]);
          }
        } catch (cleanupErr) {
          console.warn('Category storage cleanup non-fatal warning:', cleanupErr);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to delete category.'),
      };
    }
  },
};
