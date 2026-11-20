import type { OrderStatus, OrderItem, Order } from './database';

export type { OrderStatus, OrderItem, Order };

export interface OrderFilters {
  status?: OrderStatus | 'all';
  search?: string;
  sortBy?: 'created_at' | 'total_price';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

export interface WhatsAppMessageOptions {
  shopName?: string;
  shopHelpline?: string;
  includeDeliveryNote?: boolean;
}
