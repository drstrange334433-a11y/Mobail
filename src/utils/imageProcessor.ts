import JSZip from 'jszip';

export interface ProcessedImageResult {
  blob: Blob;
  width: number;
  height: number;
  originalName: string;
  targetName: string;
}

export interface MatchedProductFile {
  productId: string | null;
  productSlug: string;
  isPrimary: boolean;
  sortOrder: number;
  matchType: 'primary' | 'secondary' | 'none';
}

/**
 * Converts a product name to an alphanumeric hyphenated slug:
 * lowercase, non-alphanumerics become "-", trim leading and trailing "-".
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resizes an image file or blob in the browser to max 1200px on the longest dimension
 * and converts to WebP format (quality ~0.85), preserving aspect ratio.
 */
export async function resizeAndConvertToWebP(
  fileOrBlob: File | Blob,
  maxDimension = 1200,
  quality = 0.85
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Avoid 0 width or height
      width = Math.max(1, width);
      height = Math.max(1, height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context is not supported in this browser.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width, height });
          } else {
            reject(new Error('Failed to encode image to WebP format.'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for canvas processing.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Extracts supported image files (JPEG, PNG, WebP) from a ZIP archive in the browser.
 */
export async function extractImagesFromZip(
  zipFile: File,
  maxSizeBytes = 8 * 1024 * 1024
): Promise<{ files: File[]; warnings: string[] }> {
  const warnings: string[] = [];
  const files: File[] = [];

  try {
    const zip = await JSZip.loadAsync(zipFile);
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    const fileEntries = Object.keys(zip.files).filter((relativePath) => {
      const entry = zip.files[relativePath];
      if (entry.dir) return false;
      // Skip Mac OS metadata files & hidden files
      if (relativePath.includes('__MACOSX') || relativePath.startsWith('.')) return false;
      const baseName = relativePath.split('/').pop() || '';
      if (baseName.startsWith('.')) return false;
      const ext = baseName.split('.').pop()?.toLowerCase() || '';
      return validExtensions.includes(ext);
    });

    for (const path of fileEntries) {
      const entry = zip.files[path];
      const baseFileName = path.split('/').pop() || entry.name;
      const ext = baseFileName.split('.').pop()?.toLowerCase() || 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const blob = await entry.async('blob');

      if (blob.size > maxSizeBytes) {
        warnings.push(`"${baseFileName}": File size (${(blob.size / (1024 * 1024)).toFixed(1)}MB) exceeds 8MB limit.`);
        continue;
      }

      const extractedFile = new File([blob], baseFileName, { type: mime });
      files.push(extractedFile);
    }
  } catch (err: any) {
    throw new Error(`Failed to read ZIP archive: ${err?.message || 'Invalid or corrupted ZIP file'}`);
  }

  return { files, warnings };
}

/**
 * Matches a filename to products:
 * 1. "<slug>.<ext>" -> Primary image (isPrimary = true, sortOrder = 0)
 * 2. "<slug>-2.<ext>", "<slug>-3.<ext>" -> Extra images (isPrimary = false, sortOrder = index)
 */
export function matchFileNameToProduct(
  fileName: string,
  products: Array<{ id: string; name_en: string; slug?: string }>
): MatchedProductFile {
  // Strip extension
  const baseName = fileName.replace(/\.[^/.]+$/, '').trim();
  const fileSlug = slugify(baseName);

  // Check if file ends with -N where N is a positive integer (e.g., -2, -3)
  const suffixMatch = baseName.match(/^(.*?)-(\d+)$/);

  // Pre-calculate products with slugs
  const prods = products.map((p) => ({
    id: p.id,
    name_en: p.name_en,
    slug: p.slug || slugify(p.name_en),
  }));

  // 1. Try exact primary match: <slug>.<ext>
  const exactPrimary = prods.find((p) => p.slug === fileSlug);
  if (exactPrimary) {
    return {
      productId: exactPrimary.id,
      productSlug: exactPrimary.slug,
      isPrimary: true,
      sortOrder: 0,
      matchType: 'primary',
    };
  }

  // 2. If filename has suffix like <slug>-2.<ext>, <slug>-3.<ext>
  if (suffixMatch) {
    const candidateSlug = slugify(suffixMatch[1]);
    const orderNum = parseInt(suffixMatch[2], 10);

    const suffixProduct = prods.find((p) => p.slug === candidateSlug);
    if (suffixProduct) {
      return {
        productId: suffixProduct.id,
        productSlug: suffixProduct.slug,
        isPrimary: orderNum === 1,
        sortOrder: Math.max(0, orderNum - 1),
        matchType: orderNum === 1 ? 'primary' : 'secondary',
      };
    }
  }

  // 3. Fallback: normalized alphanumeric matching (ignoring hyphens)
  const cleanFile = fileSlug.replace(/-/g, '');
  const cleanMatch = prods.find((p) => p.slug.replace(/-/g, '') === cleanFile);
  if (cleanMatch) {
    return {
      productId: cleanMatch.id,
      productSlug: cleanMatch.slug,
      isPrimary: true,
      sortOrder: 0,
      matchType: 'primary',
    };
  }

  return {
    productId: null,
    productSlug: fileSlug,
    isPrimary: false,
    sortOrder: 0,
    matchType: 'none',
  };
}
