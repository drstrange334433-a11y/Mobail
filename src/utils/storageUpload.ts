/**
 * Paracha Mobile Shop — Storage Upload Utility
 * Handles validated uploads to Supabase storage buckets:
 * product-images, category-icons, brand-logos, banners
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type AllowedBucket = 'product-images' | 'category-icons' | 'brand-logos' | 'banners';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string | null;
  error: Error | null;
}

export async function uploadAppImage(
  bucket: AllowedBucket,
  file: File,
  folderPrefix?: string
): Promise<UploadResult> {
  if (!isSupabaseConfigured) {
    return { url: null, error: new Error('Supabase credentials are not configured.') };
  }

  // 1. File Type Check (jpeg, png, webp)
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      url: null,
      error: new Error(`Invalid file format (${file.type || 'unknown'}). Only JPEG, PNG, and WebP images are accepted.`),
    };
  }

  // 2. File Size Check (<= 5MB)
  if (file.size > MAX_FILE_SIZE) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      url: null,
      error: new Error(`Image size (${sizeInMB} MB) exceeds the 5 MB limit. Please compress or choose a smaller image.`),
    };
  }

  try {
    // 3. Unique Filename (UUID + sanitized extension)
    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ext = ['jpeg', 'jpg', 'png', 'webp'].includes(rawExt) ? (rawExt === 'jpeg' ? 'jpg' : rawExt) : 'jpg';
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filename = `${uniqueId}.${ext}`;
    const filePath = folderPrefix 
      ? `${folderPrefix.replace(/[^a-zA-Z0-9_-]/g, '_')}/${filename}` 
      : filename;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError || !uploadData) {
      const msg = uploadError?.message || 'Storage upload failed.';
      if (msg.includes('row-level security') || msg.includes('insufficient_privilege')) {
        return { 
          url: null, 
          error: new Error('Permission denied: You do not have administrator permissions to upload to this storage bucket.') 
        };
      }
      return { url: null, error: new Error(msg) };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: unknown) {
    return {
      url: null,
      error: err instanceof Error ? err : new Error('An unexpected error occurred during image upload.'),
    };
  }
}
