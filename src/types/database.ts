/**
 * Paracha Mobile Shop — Database Types Definition
 * Trust • Quality • Technology
 */

export type ProductCondition = 'new' | 'used';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type Category = {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  icon_url: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  name_en: string;
  name_ur: string;
  description_en: string | null;
  description_ur: string | null;
  category_id: string | null;
  brand_id: string | null;
  condition: ProductCondition;
  price: number;
  sale_price: number | null;
  stock_qty: number;
  is_active: boolean;
  is_featured: boolean;
  installment_available: boolean;
  pta_status: string | null;
  battery_health: string | null;
  warranty_status: string | null;
  accessories_included: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  storage: string | null;
  ram: string | null;
  color: string | null;
  price_override: number | null;
  stock_qty: number;
};

export type Banner = {
  id: string;
  title_en: string;
  title_ur: string;
  subtitle_en: string | null;
  subtitle_ur: string | null;
  button_text_en: string | null;
  button_text_ur: string | null;
  button_link: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type OrderItem = {
  product_id: string;
  name_en: string;
  name_ur: string;
  variant_id?: string | null;
  price: number;
  quantity: number;
  image_url?: string | null;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
  whatsapp_sent_at: string | null;
  created_at: string;
};

export type Setting = {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
};

export type Testimonial = {
  id: string;
  customer_name: string;
  review_en: string | null;
  review_ur: string | null;
  rating: number;
  is_active: boolean;
  created_at: string;
};

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Partial<Category> & { name_en: string; name_ur: string; slug: string };
        Update: Partial<Category>;
        Relationships: GenericRelationship[];
      };
      brands: {
        Row: Brand;
        Insert: Partial<Brand> & { name: string };
        Update: Partial<Brand>;
        Relationships: GenericRelationship[];
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { name_en: string; name_ur: string; price: number };
        Update: Partial<Product>;
        Relationships: GenericRelationship[];
      };
      product_images: {
        Row: ProductImage;
        Insert: Partial<ProductImage> & { product_id: string; image_url: string };
        Update: Partial<ProductImage>;
        Relationships: GenericRelationship[];
      };
      product_variants: {
        Row: ProductVariant;
        Insert: Partial<ProductVariant> & { product_id: string };
        Update: Partial<ProductVariant>;
        Relationships: GenericRelationship[];
      };
      banners: {
        Row: Banner;
        Insert: Partial<Banner> & { title_en: string; title_ur: string; image_url: string };
        Update: Partial<Banner>;
        Relationships: GenericRelationship[];
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & { customer_name: string; customer_phone: string; delivery_address: string; total_price: number };
        Update: Partial<Order>;
        Relationships: GenericRelationship[];
      };
      settings: {
        Row: Setting;
        Insert: Partial<Setting> & { key: string };
        Update: Partial<Setting>;
        Relationships: GenericRelationship[];
      };
      testimonials: {
        Row: Testimonial;
        Insert: Partial<Testimonial> & { customer_name: string };
        Update: Partial<Testimonial>;
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_customer_order_by_id: {
        Args: { p_order_id: string };
        Returns: Order[];
      };
      create_checkout_order: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_delivery_address: string;
          p_items: Record<string, unknown>[];
          p_total_price: number;
        };
        Returns: string;
      };
    };
  };
};
