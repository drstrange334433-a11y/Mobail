import type { Product, ProductImage, ProductVariant, Category, Brand } from './database';

export interface AdminProductListItem extends Product {
  categories?: { name_en: string; name_ur: string } | null;
  brands?: { name: string; logo_url: string | null } | null;
  product_images?: ProductImage[];
  primary_image_url?: string | null;
}

export interface AdminProductDetail extends Product {
  categories?: Category | null;
  brands?: Brand | null;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

export interface ImageUploadItem {
  id?: string;
  file?: File;
  previewUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  isExisting: boolean;
}

export interface VariantItem {
  id?: string;
  storage: string;
  ram: string;
  color: string;
  priceOverride: number | null;
  stockQty: number;
}

export interface ProductFormData {
  name_en: string;
  name_ur: string;
  description_en: string;
  description_ur: string;
  category_id: string;
  brand_id: string;
  condition: 'new' | 'used';
  price: number;
  sale_price: number | null;
  stock_qty: number;
  pta_status: string;
  battery_health: string;
  warranty_status: string;
  accessories_included: string;
  is_active: boolean;
  is_featured: boolean;
  installment_available: boolean;
}

export interface ProductFilterParams {
  search?: string;
  condition?: 'all' | 'new' | 'used';
  status?: 'all' | 'active' | 'inactive';
  featured?: 'all' | 'featured' | 'standard';
}
