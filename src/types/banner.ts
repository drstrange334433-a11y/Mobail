import type { Banner } from './database';

export interface AdminBannerListItem extends Banner {}

export interface BannerFormData {
  title_en: string;
  title_ur: string;
  subtitle_en: string;
  subtitle_ur: string;
  button_text_en: string;
  button_text_ur: string;
  button_link: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface BannerFilterParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}
