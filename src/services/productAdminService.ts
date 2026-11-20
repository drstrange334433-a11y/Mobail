/**
 * Paracha Mobile Shop — Product Administration Service
 * Pure Supabase PostgreSQL & Storage operations with strict typing
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { 
  AdminProductListItem, 
  AdminProductDetail, 
  ProductFormData, 
  ImageUploadItem, 
  VariantItem,
  ProductFilterParams 
} from '../types/product';
import type { Category, Brand, Product, ProductImage, ProductVariant } from '../types/database';
import { getProductImageUrl, normalizeImageUrl } from '../utils/productImages';

export const productAdminService = {
  /**
   * Fetch active categories for dropdown select
   */
  async getCategories(): Promise<{ data: Category[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: new Error('Supabase is not configured.') };
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }
    return { data: (data as Category[]) || [], error: null };
  },

  /**
   * Fetch active brands for dropdown select (or include assigned brand when editing)
   */
  async getBrands(assignedBrandId?: string): Promise<{ data: Brand[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: new Error('Supabase is not configured.') };
    }

    let query = supabase
      .from('brands')
      .select('*')
      .order('sort_order', { ascending: true });

    if (assignedBrandId) {
      query = query.or(`is_active.eq.true,id.eq.${assignedBrandId}`);
    } else {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: new Error(error.message) };
    }
    return { data: (data as Brand[]) || [], error: null };
  },

  /**
   * Fetch products for the Admin Products list with search and filters
   */
  async getAdminProducts(filters: ProductFilterParams = {}): Promise<{ data: AdminProductListItem[]; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: new Error('Supabase is not configured.') };
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
        .order('created_at', { ascending: false });

      // Apply condition filter
      if (filters.condition && filters.condition !== 'all') {
        query = query.eq('condition', filters.condition);
      }

      // Apply active status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      // Apply featured filter
      if (filters.featured && filters.featured !== 'all') {
        query = query.eq('is_featured', filters.featured === 'featured');
      }

      // Apply search filter (name_en or name_ur)
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`name_en.ilike.%${searchTerm}%,name_ur.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: new Error(error.message) };
      }

      // Normalize primary image for display
      const items: AdminProductListItem[] = ((data as unknown as AdminProductListItem[]) || []).map((item) => {
        let primaryUrl: string | null = null;
        if (item.product_images && item.product_images.length > 0) {
          const primary = item.product_images.find((img) => img.is_primary);
          primaryUrl = primary ? primary.image_url : item.product_images[0].image_url;
        }
        return {
          ...item,
          primary_image_url: primaryUrl ? normalizeImageUrl(primaryUrl) : getProductImageUrl(item),
        };
      });

      return { data: items, error: null };
    } catch (err: unknown) {
      return {
        data: [],
        error: err instanceof Error ? err : new Error('Failed to query admin products.'),
      };
    }
  },

  /**
   * Fetch single product by ID with full details (images and variants)
   */
  async getAdminProduct(id: string): Promise<{ data: AdminProductDetail | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (*),
          brands:brand_id (*)
        `)
        .eq('id', id)
        .single();

      if (productError || !productData) {
        return { data: null, error: new Error(productError?.message || 'Product not found.') };
      }

      // Fetch images ordered by sort_order
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('sort_order', { ascending: true });

      if (imagesError) {
        return { data: null, error: new Error(imagesError.message) };
      }

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);

      if (variantsError) {
        return { data: null, error: new Error(variantsError.message) };
      }

      const detail: AdminProductDetail = {
        ...(productData as unknown as Product),
        categories: (productData as unknown as { categories?: Category }).categories || null,
        brands: (productData as unknown as { brands?: Brand }).brands || null,
        product_images: (imagesData as ProductImage[]) || [],
        product_variants: (variantsData as ProductVariant[]) || [],
      };

      return { data: detail, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to load product details.'),
      };
    }
  },

  /**
   * Upload an image file or blob to Supabase Storage bucket `product-images`
   * Allowed types: jpeg, png, webp (max 8MB each)
   * File path: product_id/uuid.webp
   * Saves getPublicUrl() in product_images.image_url
   */
  async uploadProductImage(file: File | Blob, productId: string): Promise<{ url: string | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { url: null, error: new Error('Supabase is not configured.') };
    }

    // Size validation (8MB max)
    if (file.size > 8 * 1024 * 1024) {
      return { url: null, error: new Error('File exceeds 8MB limit.') };
    }

    try {
      const fileUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const filePath = `${productId}/${fileUuid}.webp`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/webp',
        });

      if (uploadError || !uploadData) {
        return { url: null, error: new Error(uploadError?.message || 'Storage upload failed.') };
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(uploadData.path);

      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: unknown) {
      return {
        url: null,
        error: err instanceof Error ? err : new Error('Failed to upload image file.'),
      };
    }
  },

  /**
   * Extract relative storage path from full Supabase URL or relative string
   */
  extractStoragePath(url: string): string | null {
    if (!url) return null;
    const bucketToken = '/product-images/';
    const idx = url.indexOf(bucketToken);
    if (idx !== -1) {
      return decodeURIComponent(url.substring(idx + bucketToken.length).split('?')[0]);
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      return url.split('?')[0];
    }
    return null;
  },

  /**
   * Delete an image record and file
   * (delete the DB row first, then try to remove the storage file; never block on cleanup failure)
   */
  async deleteProductImage(imageId: string, imageUrl?: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      let storagePath: string | null = null;
      if (imageUrl) {
        storagePath = this.extractStoragePath(imageUrl);
      } else {
        const { data: imgRow } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('id', imageId)
          .single();
        if (imgRow?.image_url) {
          storagePath = this.extractStoragePath(imgRow.image_url);
        }
      }

      // 1. Delete DB row first
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        return { error: new Error(dbError.message) };
      }

      // 2. Try to remove the storage file; never block on cleanup failure
      if (storagePath) {
        try {
          await supabase.storage.from('product-images').remove([storagePath]);
        } catch (cleanupErr) {
          console.warn('Storage cleanup non-fatal warning:', cleanupErr);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to delete product image.'),
      };
    }
  },

  /**
   * Update primary flag of an image
   */
  async setPrimaryProductImage(productId: string, imageId: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    // Unset primary for all images of this product
    const { error: resetError } = await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);

    if (resetError) {
      return { error: new Error(resetError.message) };
    }

    // Set new primary
    const { error: setError } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (setError) {
      return { error: new Error(setError.message) };
    }

    return { error: null };
  },

  /**
   * Create a new product with images and variants in correct sequence
   */
  async createProduct(
    formData: ProductFormData,
    images: ImageUploadItem[],
    variants: VariantItem[]
  ): Promise<{ product: Product | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { product: null, error: new Error('Supabase is not configured.') };
    }

    try {
      // 1. Insert product record
      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          name_en: formData.name_en.trim(),
          name_ur: formData.name_ur.trim(),
          description_en: formData.description_en.trim() || null,
          description_ur: formData.description_ur.trim() || null,
          category_id: formData.category_id || null,
          brand_id: formData.brand_id || null,
          condition: formData.condition,
          price: Number(formData.price),
          sale_price: formData.sale_price !== null && formData.sale_price !== undefined ? Number(formData.sale_price) : null,
          stock_qty: Number(formData.stock_qty),
          pta_status: formData.pta_status.trim() || null,
          battery_health: formData.battery_health.trim() || null,
          warranty_status: formData.warranty_status.trim() || null,
          accessories_included: formData.accessories_included.trim() || null,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          installment_available: formData.installment_available,
        })
        .select()
        .single();

      if (insertError || !insertedProduct) {
        return { product: null, error: new Error(insertError?.message || 'Failed to insert product record.') };
      }

      const newProductId = insertedProduct.id;

      // 2. Upload images and insert product_images records
      if (images.length > 0) {
        let hasPrimary = images.some((img) => img.isPrimary);
        for (let i = 0; i < images.length; i++) {
          const item = images[i];
          let imageUrl = item.previewUrl;

          // If it's a file upload, upload to Supabase Storage
          if (item.file) {
            const uploadRes = await this.uploadProductImage(item.file, newProductId);
            if (uploadRes.error) {
              console.error('Image upload warning:', uploadRes.error);
              continue; // proceed with remaining images
            }
            if (uploadRes.url) {
              imageUrl = uploadRes.url;
            }
          }

          // First image is primary by default if none explicitly set
          const isPrimary = hasPrimary ? item.isPrimary : i === 0;

          await supabase.from('product_images').insert({
            product_id: newProductId,
            image_url: imageUrl,
            sort_order: i,
            is_primary: isPrimary,
          });
        }
      }

      // 3. Insert product_variants records
      if (variants.length > 0) {
        const variantPayloads = variants.map((v) => ({
          product_id: newProductId,
          storage: v.storage.trim() || null,
          ram: v.ram.trim() || null,
          color: v.color.trim() || null,
          price_override: v.priceOverride !== null && v.priceOverride !== undefined ? Number(v.priceOverride) : null,
          stock_qty: Number(v.stockQty) || 0,
        }));

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantPayloads);

        if (variantError) {
          console.error('Variant insertion error:', variantError);
        }
      }

      return { product: insertedProduct as Product, error: null };
    } catch (err: unknown) {
      return {
        product: null,
        error: err instanceof Error ? err : new Error('An unexpected error occurred during product creation.'),
      };
    }
  },

  /**
   * Update an existing product with images and variants
   */
  async updateProduct(
    productId: string,
    formData: ProductFormData,
    images: ImageUploadItem[],
    variants: VariantItem[]
  ): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      // 1. Update product table
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name_en: formData.name_en.trim(),
          name_ur: formData.name_ur.trim(),
          description_en: formData.description_en.trim() || null,
          description_ur: formData.description_ur.trim() || null,
          category_id: formData.category_id || null,
          brand_id: formData.brand_id || null,
          condition: formData.condition,
          price: Number(formData.price),
          sale_price: formData.sale_price !== null && formData.sale_price !== undefined ? Number(formData.sale_price) : null,
          stock_qty: Number(formData.stock_qty),
          pta_status: formData.pta_status.trim() || null,
          battery_health: formData.battery_health.trim() || null,
          warranty_status: formData.warranty_status.trim() || null,
          accessories_included: formData.accessories_included.trim() || null,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          installment_available: formData.installment_available,
        })
        .eq('id', productId);

      if (updateError) {
        return { error: new Error(updateError.message) };
      }

      // 2. Sync Images
      // Delete existing image records that were removed from the form
      const existingImageIdsToKeep = images
        .filter((img) => img.isExisting && img.id)
        .map((img) => img.id as string);

      if (existingImageIdsToKeep.length > 0) {
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)
          .not('id', 'in', `(${existingImageIdsToKeep.join(',')})`);
      } else {
        // If no existing images kept, remove all previous images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);
      }

      // Upload and insert new images, and update existing image order / primary status
      let hasPrimary = images.some((img) => img.isPrimary);
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const isPrimary = hasPrimary ? item.isPrimary : i === 0;

        if (item.isExisting && item.id) {
          // Update order and primary status
          await supabase
            .from('product_images')
            .update({
              sort_order: i,
              is_primary: isPrimary,
            })
            .eq('id', item.id);
        } else if (item.file) {
          // Upload new file
          const uploadRes = await this.uploadProductImage(item.file, productId);
          if (uploadRes.url) {
            await supabase.from('product_images').insert({
              product_id: productId,
              image_url: uploadRes.url,
              sort_order: i,
              is_primary: isPrimary,
            });
          }
        }
      }

      // 3. Sync Variants
      // Delete existing variants and re-insert updated list
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      if (variants.length > 0) {
        const variantPayloads = variants.map((v) => ({
          product_id: productId,
          storage: v.storage.trim() || null,
          ram: v.ram.trim() || null,
          color: v.color.trim() || null,
          price_override: v.priceOverride !== null && v.priceOverride !== undefined ? Number(v.priceOverride) : null,
          stock_qty: Number(v.stockQty) || 0,
        }));

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantPayloads);

        if (variantError) {
          console.error('Variant sync error:', variantError);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('An unexpected error occurred while updating the product.'),
      };
    }
  },

  /**
   * Delete a product record
   * PostgreSQL foreign keys CASCADE automatically delete product_images and product_variants
   */
  async deleteProduct(productId: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('Failed to delete product.'),
      };
    }
  },
};
