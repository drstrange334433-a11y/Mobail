/**
 * Paracha Mobile Shop — Customer Order History & Tracking Service
 * Allows customers to look up order status by Order ID and track past orders locally.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order, OrderStatus } from '../types/order';

const LOCAL_STORAGE_ORDERS_KEY = 'paracha_customer_order_history_v1';

// Seed demo orders for testing and demonstration when database is empty or offline
const DEMO_ORDERS: Order[] = [
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    customer_name: 'Muhammad Usman Khan',
    customer_phone: '+92 300 9876543',
    delivery_address: 'House #42, Street 8, Sector F-11/2, Islamabad',
    total_price: 38500,
    status: 'shipped' as OrderStatus,
    whatsapp_sent_at: '2026-10-12T14:30:00.000Z',
    created_at: '2026-10-11T09:15:00.000Z',
    items: [
      {
        product_id: 'infinix-hot-40i',
        name_en: 'Infinix Hot 40i (8GB RAM / 128GB ROM)',
        name_ur: 'انفنکس ہاٹ 40 آئی',
        price: 36000,
        quantity: 1,
        image_url: null,
      },
      {
        product_id: 'joyroom-fast-charger',
        name_en: 'Joyroom 30W Super Fast Charger Type-C',
        name_ur: 'جوائے روم 30 واٹ فاسٹ چارجر',
        price: 2500,
        quantity: 1,
        image_url: null,
      },
    ],
  },
  {
    id: '3f8b9102-18ad-4c59-b132-901d8e124801',
    customer_name: 'Ayesha Malik',
    customer_phone: '+92 321 4567890',
    delivery_address: 'Flat 304, Gulberg Heights, Main Boulevard, Lahore',
    total_price: 52000,
    status: 'processing' as OrderStatus,
    whatsapp_sent_at: null,
    created_at: '2026-10-13T06:20:00.000Z',
    items: [
      {
        product_id: 'samsung-galaxy-a15',
        name_en: 'Samsung Galaxy A15 (6GB / 128GB) PTA Approved',
        name_ur: 'سیمسنگ گلیکسی اے 15',
        price: 52000,
        quantity: 1,
        image_url: null,
      },
    ],
  },
  {
    id: '9d2a105c-55e1-482a-a9e4-c5b897e20344',
    customer_name: 'Bilal Tariq',
    customer_phone: '+92 333 1122334',
    delivery_address: 'Shop #12, Commercial Market, Rawalpindi',
    total_price: 18500,
    status: 'delivered' as OrderStatus,
    whatsapp_sent_at: '2026-10-09T18:00:00.000Z',
    created_at: '2026-10-08T11:45:00.000Z',
    items: [
      {
        product_id: 'earbuds-pro',
        name_en: 'Soundcore Wireless Noise-Cancelling Earbuds',
        name_ur: 'ساؤنڈ کور وائرلیس ایئربڈز',
        price: 18500,
        quantity: 1,
        image_url: null,
      },
    ],
  },
];

export const customerOrderService = {
  /**
   * Look up an order by its ID (UUID or partial ID)
   */
  async lookupOrder(rawOrderId: string): Promise<{ data: Order | null; error: string | null }> {
    const orderId = rawOrderId.trim();
    if (!orderId) {
      return { data: null, error: 'Please enter an Order ID to search.' };
    }

    // 1. Try querying Supabase if configured
    if (isSupabaseConfigured) {
      try {
        // Try calling the dedicated secure RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_customer_order_by_id', {
          p_order_id: orderId,
        });

        if (!rpcError && rpcData) {
          const order = Array.isArray(rpcData) ? rpcData[0] : rpcData;
          if (order) {
            this.saveOrderToLocalStorage(order as Order);
            return { data: order as Order, error: null };
          }
        }

        // Fallback to direct table query
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        if (!error && data) {
          const order = data as Order;
          this.saveOrderToLocalStorage(order);
          return { data: order, error: null };
        }
      } catch (err) {
        console.warn('Database order lookup error, checking local history:', err);
      }
    }

    // 2. Check local storage saved orders
    const localOrders = this.getSavedOrdersFromLocalStorage();
    const matchedLocal = localOrders.find(
      (o) => o.id.toLowerCase() === orderId.toLowerCase() || o.id.toLowerCase().startsWith(orderId.toLowerCase())
    );
    if (matchedLocal) {
      return { data: matchedLocal, error: null };
    }

    // 3. Check demo orders for preview / test IDs
    const matchedDemo = DEMO_ORDERS.find(
      (o) => o.id.toLowerCase() === orderId.toLowerCase() || o.id.toLowerCase().startsWith(orderId.toLowerCase())
    );
    if (matchedDemo) {
      this.saveOrderToLocalStorage(matchedDemo);
      return { data: matchedDemo, error: null };
    }

    return {
      data: null,
      error: `No order found with ID "${orderId}". Please verify the order number on your invoice, SMS, or WhatsApp confirmation.`,
    };
  },

  /**
   * Retrieve all saved orders in the customer's browser
   */
  async getSavedOrders(): Promise<Order[]> {
    let orders = this.getSavedOrdersFromLocalStorage();

    // If local storage is completely empty, initialize with demo orders so the user can immediately test
    if (orders.length === 0) {
      orders = DEMO_ORDERS;
      try {
        localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
      } catch {
        // Ignore localStorage quota/private errors
      }
    }

    // If database is active, attempt to refresh statuses of these saved orders
    if (isSupabaseConfigured && orders.length > 0) {
      try {
        const orderIds = orders.map((o) => o.id);
        const { data } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds);

        if (data && data.length > 0) {
          const dbOrdersMap = new Map((data as Order[]).map((o) => [o.id, o]));
          orders = orders.map((local) => dbOrdersMap.get(local.id) || local);
          localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
        }
      } catch {
        // Fallback to local cached copies
      }
    }

    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Save an order to local storage
   */
  saveOrderToLocalStorage(order: Order): void {
    try {
      const current = this.getSavedOrdersFromLocalStorage();
      const existingIdx = current.findIndex((o) => o.id === order.id);
      let updated: Order[];

      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = order;
      } else {
        updated = [order, ...current];
      }

      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated.slice(0, 25)));
    } catch {
      // storage quota or incognito mode exception
    }
  },

  /**
   * Remove an order from local history
   */
  removeOrderFromLocalStorage(orderId: string): Order[] {
    try {
      const current = this.getSavedOrdersFromLocalStorage();
      const updated = current.filter((o) => o.id !== orderId);
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  /**
   * Read raw orders from local storage
   */
  getSavedOrdersFromLocalStorage(): Order[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Get demo orders for quick-testing buttons
   */
  getDemoOrders(): Order[] {
    return DEMO_ORDERS;
  },
};
