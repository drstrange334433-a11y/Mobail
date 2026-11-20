-- ====================================================================
-- PARACHA MOBILE SHOP — INITIAL POSTGRESQL SCHEMA MIGRATION
-- Tagline: Trust • Quality • Technology
-- Description: Core tables, foreign keys, constraints, indexes & RLS policies
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ur TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ur TEXT NOT NULL,
    description_en TEXT,
    description_ur TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    condition TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(12, 2) CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < price)),
    stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    installment_available BOOLEAN NOT NULL DEFAULT false,
    pta_status TEXT DEFAULT 'PTA Approved',
    battery_health TEXT,
    warranty_status TEXT,
    accessories_included TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for products updated_at
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false
);

-- 6. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage TEXT,
    ram TEXT,
    color TEXT,
    price_override NUMERIC(12, 2) CHECK (price_override IS NULL OR price_override >= 0),
    stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0)
);

-- 7. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ur TEXT NOT NULL,
    subtitle_en TEXT,
    subtitle_ur TEXT,
    button_text_en TEXT,
    button_text_ur TEXT,
    button_link TEXT,
    image_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    whatsapp_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for settings updated_at
CREATE TRIGGER set_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 10. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    review_en TEXT,
    review_ur TEXT,
    rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON public.categories(is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_brands_active_sort ON public.brands(is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON public.products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_condition ON public.products(condition);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_banners_active_sort ON public.banners(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON public.testimonials(is_active);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- CATEGORIES POLICIES
-- Public can read active categories
CREATE POLICY "Public users can view active categories"
ON public.categories FOR SELECT
TO public
USING (is_active = true);

-- Authenticated admins can perform all actions on categories
CREATE POLICY "Admins have full access to categories"
ON public.categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- BRANDS POLICIES
-- Public can read active brands
CREATE POLICY "Public users can view active brands"
ON public.brands FOR SELECT
TO public
USING (is_active = true);

-- Authenticated admins can perform all actions on brands
CREATE POLICY "Admins have full access to brands"
ON public.brands FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PRODUCTS POLICIES
-- Public can view active products
CREATE POLICY "Public users can view active products"
ON public.products FOR SELECT
TO public
USING (is_active = true);

-- Authenticated admins have full access to products
CREATE POLICY "Admins have full access to products"
ON public.products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PRODUCT IMAGES POLICIES
-- Public can view images of active products
CREATE POLICY "Public users can view product images"
ON public.product_images FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_images.product_id AND p.is_active = true
    )
);

-- Authenticated admins have full access to product images
CREATE POLICY "Admins have full access to product images"
ON public.product_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- PRODUCT VARIANTS POLICIES
-- Public can view variants of active products
CREATE POLICY "Public users can view product variants"
ON public.product_variants FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id AND p.is_active = true
    )
);

-- Authenticated admins have full access to product variants
CREATE POLICY "Admins have full access to product variants"
ON public.product_variants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- BANNERS POLICIES
-- Public can view active banners
CREATE POLICY "Public users can view active banners"
ON public.banners FOR SELECT
TO public
USING (is_active = true);

-- Authenticated admins have full access to banners
CREATE POLICY "Admins have full access to banners"
ON public.banners FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ORDERS POLICIES
-- Anonymous / public users cannot read, edit, or delete orders
-- Anonymous users can only insert new orders (checkout)
CREATE POLICY "Customers can create orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

-- Authenticated admins have full access to view, update, delete orders
CREATE POLICY "Admins have full access to orders"
ON public.orders FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- SETTINGS POLICIES
-- Public can view settings (e.g. shop_name, whatsapp_number, address)
CREATE POLICY "Public users can read settings"
ON public.settings FOR SELECT
TO public
USING (true);

-- Only authenticated admins can insert, update, or delete settings
CREATE POLICY "Admins can manage settings"
ON public.settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- TESTIMONIALS POLICIES
-- Public can view active testimonials
CREATE POLICY "Public users can view active testimonials"
ON public.testimonials FOR SELECT
TO public
USING (is_active = true);

-- Authenticated admins have full access to testimonials
CREATE POLICY "Admins have full access to testimonials"
ON public.testimonials FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
