import type { Category } from './database';

export interface AdminCategoryListItem extends Category {
  parent?: { id: string; name_en: string; name_ur: string } | null;
  product_count?: number;
  children_count?: number;
}

export interface CategoryFormData {
  name_en: string;
  name_ur: string;
  slug: string;
  parent_id: string | null;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CategoryFilterParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface CategoryUsageCheck {
  productCount: number;
  childCount: number;
  canDeleteSafely: boolean;
}
