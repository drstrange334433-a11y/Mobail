/**
 * Paracha Mobile Shop — Product Image Resolution & Category Fallbacks
 * 
 * Strict policy:
 * 1. Product images come SOLELY from the product_images table (primary first, then sort_order).
 * 2. NO hardcoded product name, SKU, or ID mappings.
 * 3. When a product has no image, render the appropriate original category placeholder SVG.
 */

import type { Product, ProductImage } from '../types/database';
import { supabase } from '../lib/supabase';

export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  'smartphones': '/images/categories/smartphones.svg',
  'used-phones': '/images/categories/used-phones.svg',
  'tablets': '/images/categories/tablets.svg',
  'smart-watches': '/images/categories/smart-watches.svg',
  'chargers-cables': '/images/categories/chargers-cables.svg',
  'power-banks': '/images/categories/power-banks.svg',
  'earbuds-headphones': '/images/categories/earbuds-headphones.svg',
  'cases-covers': '/images/categories/cases-covers.svg',
  'screen-protectors': '/images/categories/screen-protectors.svg',
  'bluetooth-speakers': '/images/categories/bluetooth-speakers.svg',
  'memory-cards-usb': '/images/categories/memory-cards-usb.svg',
};

export const DEFAULT_CATEGORY_PLACEHOLDER = '/images/categories/default.svg';

/**
 * Returns the generic SVG placeholder for a given category.
 * If condition is 'used' and product is a phone, returns used-phones.svg.
 */
export function getCategoryPlaceholderUrl(categorySlug?: string | null, condition?: string | null): string {
  if (condition === 'used' && (!categorySlug || categorySlug === 'smartphones' || categorySlug === 'used-phones')) {
    return CATEGORY_PLACEHOLDERS['used-phones'];
  }

  if (!categorySlug) {
    return condition === 'used' ? CATEGORY_PLACEHOLDERS['used-phones'] : DEFAULT_CATEGORY_PLACEHOLDER;
  }

  const slug = categorySlug.toLowerCase().trim();

  // Direct match
  if (CATEGORY_PLACEHOLDERS[slug]) {
    return CATEGORY_PLACEHOLDERS[slug];
  }

  // Alias mappings
  if (slug.includes('smart') && slug.includes('watch')) return CATEGORY_PLACEHOLDERS['smart-watches'];
  if (slug.includes('watch')) return CATEGORY_PLACEHOLDERS['smart-watches'];
  if (slug.includes('charger') || slug.includes('cable') || slug.includes('adapter')) return CATEGORY_PLACEHOLDERS['chargers-cables'];
  if (slug.includes('power') || slug.includes('bank')) return CATEGORY_PLACEHOLDERS['power-banks'];
  if (slug.includes('earbud') || slug.includes('headphone') || slug.includes('audio') || slug.includes('handsfree')) return CATEGORY_PLACEHOLDERS['earbuds-headphones'];
  if (slug.includes('case') || slug.includes('cover')) return CATEGORY_PLACEHOLDERS['cases-covers'];
  if (slug.includes('protector') || slug.includes('glass') || slug.includes('film')) return CATEGORY_PLACEHOLDERS['screen-protectors'];
  if (slug.includes('speaker')) return CATEGORY_PLACEHOLDERS['bluetooth-speakers'];
  if (slug.includes('memory') || slug.includes('card') || slug.includes('usb') || slug.includes('otg') || slug.includes('flash')) return CATEGORY_PLACEHOLDERS['memory-cards-usb'];
  if (slug.includes('tablet') || slug.includes('ipad')) return CATEGORY_PLACEHOLDERS['tablets'];
  if (slug.includes('used') && slug.includes('phone')) return CATEGORY_PLACEHOLDERS['used-phones'];
  if (slug.includes('phone') || slug.includes('mobile')) return CATEGORY_PLACEHOLDERS['smartphones'];

  return DEFAULT_CATEGORY_PLACEHOLDER;
}

/**
 * Normalizes an image URL, generating public URL from Supabase storage if needed.
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();

  // If already absolute HTTP(S) or root-relative URL (/images/...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }

  // If it's a Supabase storage path inside the product-images bucket
  try {
    const { data } = supabase.storage.from('product-images').getPublicUrl(trimmed);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch {
    // continue
  }

  return trimmed;
}

/**
 * Resolves the primary image URL for any product:
 * MUST come ONLY from product_images (primary first, then sort_order ascending).
 * If no image exists, returns the appropriate category placeholder.
 */
export function getProductImageUrl(
  product?: {
    condition?: string | null;
    product_images?: ProductImage[];
    primary_image_url?: string | null;
    categories?: { slug?: string; [key: string]: any } | null;
    category_slug?: string;
    [key: string]: any;
  } | null,
  overrideCategorySlug?: string | null
): string {
  const categorySlug = overrideCategorySlug || (product?.categories && 'slug' in product.categories ? product.categories.slug : null) || product?.category_slug || null;
  const condition = product?.condition || null;

  if (!product) {
    return getCategoryPlaceholderUrl(categorySlug, condition);
  }

  // 1. If product_images array is provided
  if (product.product_images && product.product_images.length > 0) {
    // Sort: primary first, then sort_order ascending
    const sorted = [...product.product_images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

    const chosen = sorted[0];
    if (chosen && chosen.image_url && chosen.image_url.trim()) {
      const normalized = normalizeImageUrl(chosen.image_url);
      if (normalized) return normalized;
    }
  }

  // 2. If primary_image_url was precomputed
  if (product.primary_image_url && product.primary_image_url.trim()) {
    const normalized = normalizeImageUrl(product.primary_image_url);
    if (normalized) return normalized;
  }

  // 3. Fallback: Generic, original category placeholder
  return getCategoryPlaceholderUrl(categorySlug, condition);
}

/**
 * Image error handler to gracefully fallback to category placeholder if image fails to load.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  categorySlug?: string | null,
  condition?: string | null
) {
  const target = e.currentTarget;
  const fallback = getCategoryPlaceholderUrl(categorySlug, condition);
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}
