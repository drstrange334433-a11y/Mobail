import type { Testimonial } from './database';

export type { Testimonial };

export interface AdminTestimonialListItem extends Testimonial {}

export interface TestimonialFormData {
  customer_name: string;
  review_en: string;
  review_ur: string;
  rating: number;
  is_active: boolean;
}

export interface TestimonialFilterParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  rating?: number | 'all';
}
