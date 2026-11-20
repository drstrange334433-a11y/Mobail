import type { Brand } from './database';

export interface AdminBrandListItem extends Brand {
  product_count?: number;
}

export interface BrandFormData {
  name: string;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface BrandFilterParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface BrandUsageCheck {
  productCount: number;
  canDeleteSafely: boolean;
}
