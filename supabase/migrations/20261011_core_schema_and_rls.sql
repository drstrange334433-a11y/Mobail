-- ====================================================================
-- PARACHA MOBILE SHOP — CORE DATABASE SCHEMA & RLS MIGRATION
-- File: supabase/migrations/20261011_core_schema_and_rls.sql
-- Status: SQL written, not yet run
-- Description:
--   Creates complete schema, check constraints, foreign keys, indexes,
--   Row Level Security policies, storage buckets & policies, and
--   table grants for all tables used by Paracha Mobile Shop.
-- Note:
--   Live database already contains public.admins and public.testimonials
--   with public.is_admin(). This script is 100% idempotent and preserves them.
-- ====================================================================

-- 1. EXTENSIONS & HELPER FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    name_en TEXT NOT NULL CHECK (char_length(trim(name_en)) >= 1),
    name_ur TEXT NOT NULL CHECK (char_length(trim(name_ur)) >= 1),
    slug TEXT NOT NULL UNIQUE CHECK (char_length(trim(slug)) >= 1),
    icon_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON public.categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 3. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 1),
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_active_sort ON public.brands(is_active, sort_order);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL CHECK (char_length(trim(name_en)) >= 1),
    name_ur TEXT NOT NULL CHECK (char_length(trim(name_ur)) >= 1),
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

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON public.products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_condition ON public.products(condition);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Automatic updated_at trigger for products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_products_updated_at'
    ) THEN
        CREATE TRIGGER set_products_updated_at
        BEFORE UPDATE ON public.products
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 5. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL CHECK (char_length(trim(image_url)) >= 1),
    sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON public.product_images(product_id, sort_order);

-- 6. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage TEXT,
    ram TEXT,
    color TEXT,
    price_override NUMERIC(12, 2) CHECK (price_override IS NULL OR price_override >= 0),
    stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

-- 7. BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL CHECK (char_length(trim(title_en)) >= 1),
    title_ur TEXT NOT NULL CHECK (char_length(trim(title_ur)) >= 1),
    subtitle_en TEXT,
    subtitle_ur TEXT,
    button_text_en TEXT,
    button_text_ur TEXT,
    button_link TEXT,
    image_url TEXT NOT NULL CHECK (char_length(trim(image_url)) >= 1),
    sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active_sort ON public.banners(is_active, sort_order);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL CHECK (char_length(trim(customer_name)) >= 1),
    customer_phone TEXT NOT NULL CHECK (char_length(trim(customer_phone)) >= 1),
    delivery_address TEXT NOT NULL CHECK (char_length(trim(delivery_address)) >= 1),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    whatsapp_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure whatsapp_sent_at column exists if table was previously defined
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

-- 9. ORDER ITEMS TABLE (Relational companion for multi-item structure)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    name_en TEXT NOT NULL CHECK (char_length(trim(name_en)) >= 1),
    name_ur TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 10. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE CHECK (char_length(trim(key)) >= 1),
    value TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_settings_updated_at'
    ) THEN
        CREATE TRIGGER set_settings_updated_at
        BEFORE UPDATE ON public.settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- --------------------------------------------------------------------
-- A. CATEGORIES POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "categories_admin_select" ON public.categories;
CREATE POLICY "categories_admin_select" ON public.categories
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update" ON public.categories
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete" ON public.categories
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- B. BRANDS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_public_select" ON public.brands;
CREATE POLICY "brands_public_select" ON public.brands
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "brands_admin_select" ON public.brands;
CREATE POLICY "brands_admin_select" ON public.brands
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "brands_admin_insert" ON public.brands;
CREATE POLICY "brands_admin_insert" ON public.brands
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "brands_admin_update" ON public.brands;
CREATE POLICY "brands_admin_update" ON public.brands
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "brands_admin_delete" ON public.brands;
CREATE POLICY "brands_admin_delete" ON public.brands
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- C. PRODUCTS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select" ON public.products
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "products_admin_select" ON public.products;
CREATE POLICY "products_admin_select" ON public.products
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update" ON public.products
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- D. PRODUCT IMAGES POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_public_select" ON public.product_images;
CREATE POLICY "product_images_public_select" ON public.product_images
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_images.product_id AND p.is_active = true
        )
    );

DROP POLICY IF EXISTS "product_images_admin_select" ON public.product_images;
CREATE POLICY "product_images_admin_select" ON public.product_images
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_insert" ON public.product_images;
CREATE POLICY "product_images_admin_insert" ON public.product_images
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
CREATE POLICY "product_images_admin_update" ON public.product_images
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;
CREATE POLICY "product_images_admin_delete" ON public.product_images
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- E. PRODUCT VARIANTS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_variants_public_select" ON public.product_variants;
CREATE POLICY "product_variants_public_select" ON public.product_variants
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id AND p.is_active = true
        )
    );

DROP POLICY IF EXISTS "product_variants_admin_select" ON public.product_variants;
CREATE POLICY "product_variants_admin_select" ON public.product_variants
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_insert" ON public.product_variants;
CREATE POLICY "product_variants_admin_insert" ON public.product_variants
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_update" ON public.product_variants;
CREATE POLICY "product_variants_admin_update" ON public.product_variants
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_delete" ON public.product_variants;
CREATE POLICY "product_variants_admin_delete" ON public.product_variants
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- F. BANNERS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_select" ON public.banners;
CREATE POLICY "banners_public_select" ON public.banners
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "banners_admin_select" ON public.banners;
CREATE POLICY "banners_admin_select" ON public.banners
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "banners_admin_insert" ON public.banners;
CREATE POLICY "banners_admin_insert" ON public.banners
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "banners_admin_update" ON public.banners;
CREATE POLICY "banners_admin_update" ON public.banners
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "banners_admin_delete" ON public.banners;
CREATE POLICY "banners_admin_delete" ON public.banners
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- G. ORDERS POLICIES
-- Strict Security: Customer info is NEVER publicly selectable.
-- Anon & Authenticated customers may only INSERT with initial status 'pending'
-- and whatsapp_sent_at NULL. Admin has full access.
-- --------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
DROP POLICY IF EXISTS "orders_customer_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;

CREATE POLICY "orders_customer_insert" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        status = 'pending' AND
        whatsapp_sent_at IS NULL
    );

CREATE POLICY "orders_admin_select" ON public.orders
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "orders_admin_insert" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "orders_admin_update" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "orders_admin_delete" ON public.orders
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- H. ORDER ITEMS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_customer_insert" ON public.order_items;
CREATE POLICY "order_items_customer_insert" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (quantity > 0 AND price >= 0);

DROP POLICY IF EXISTS "order_items_admin_select" ON public.order_items;
CREATE POLICY "order_items_admin_select" ON public.order_items
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_insert" ON public.order_items;
CREATE POLICY "order_items_admin_insert" ON public.order_items
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_update" ON public.order_items;
CREATE POLICY "order_items_admin_update" ON public.order_items
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_delete" ON public.order_items;
CREATE POLICY "order_items_admin_delete" ON public.order_items
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- I. SETTINGS POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_select" ON public.settings;
CREATE POLICY "settings_public_select" ON public.settings
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "settings_admin_select" ON public.settings;
CREATE POLICY "settings_admin_select" ON public.settings
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "settings_admin_insert" ON public.settings;
CREATE POLICY "settings_admin_insert" ON public.settings
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "settings_admin_update" ON public.settings;
CREATE POLICY "settings_admin_update" ON public.settings
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "settings_admin_delete" ON public.settings;
CREATE POLICY "settings_admin_delete" ON public.settings
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ====================================================================
-- SECURITY DEFINER FUNCTION FOR ANONYMOUS CHECKOUT
-- Returns newly created order UUID without granting SELECT on orders.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.create_checkout_order(
    p_customer_name text,
    p_customer_phone text,
    p_delivery_address text,
    p_items jsonb,
    p_total_price numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id uuid;
BEGIN
    IF trim(coalesce(p_customer_name, '')) = '' THEN
        RAISE EXCEPTION 'customer_name is required';
    END IF;
    IF trim(coalesce(p_customer_phone, '')) = '' THEN
        RAISE EXCEPTION 'customer_phone is required';
    END IF;
    IF trim(coalesce(p_delivery_address, '')) = '' THEN
        RAISE EXCEPTION 'delivery_address is required';
    END IF;
    IF coalesce(p_total_price, 0) < 0 THEN
        RAISE EXCEPTION 'total_price cannot be negative';
    END IF;

    INSERT INTO public.orders (
        customer_name,
        customer_phone,
        delivery_address,
        items,
        total_price,
        status,
        whatsapp_sent_at
    ) VALUES (
        trim(p_customer_name),
        trim(p_customer_phone),
        trim(p_delivery_address),
        coalesce(p_items, '[]'::jsonb),
        p_total_price,
        'pending',
        NULL
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;


-- ====================================================================
-- STORAGE BUCKETS AND STORAGE POLICIES
-- Buckets: product-images, category-icons, brand-logos, banners
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-images', 'product-images', true),
    ('category-icons', 'category-icons', true),
    ('brand-logos', 'brand-logos', true),
    ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Objects Policies
DROP POLICY IF EXISTS "Public can view store images" ON storage.objects;
CREATE POLICY "Public can view store images" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id IN ('product-images', 'category-icons', 'brand-logos', 'banners'));

DROP POLICY IF EXISTS "Admins can upload to store buckets" ON storage.objects;
CREATE POLICY "Admins can upload to store buckets" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN ('product-images', 'category-icons', 'brand-logos', 'banners')
        AND public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can update store bucket files" ON storage.objects;
CREATE POLICY "Admins can update store bucket files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id IN ('product-images', 'category-icons', 'brand-logos', 'banners')
        AND public.is_admin()
    )
    WITH CHECK (
        bucket_id IN ('product-images', 'category-icons', 'brand-logos', 'banners')
        AND public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can delete store bucket files" ON storage.objects;
CREATE POLICY "Admins can delete store bucket files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id IN ('product-images', 'category-icons', 'brand-logos', 'banners')
        AND public.is_admin()
    );


-- ====================================================================
-- TABLE GRANTS
-- Revoke all first, then grant strictly needed privileges.
-- ====================================================================

-- 1. categories
REVOKE ALL ON public.categories FROM anon, authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;

-- 2. brands
REVOKE ALL ON public.brands FROM anon, authenticated;
GRANT SELECT ON public.brands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;

-- 3. products
REVOKE ALL ON public.products FROM anon, authenticated;
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- 4. product_images
REVOKE ALL ON public.product_images FROM anon, authenticated;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;

-- 5. product_variants
REVOKE ALL ON public.product_variants FROM anon, authenticated;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;

-- 6. banners
REVOKE ALL ON public.banners FROM anon, authenticated;
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;

-- 7. orders
REVOKE ALL ON public.orders FROM anon, authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

-- 8. order_items
REVOKE ALL ON public.order_items FROM anon, authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

-- 9. settings
REVOKE ALL ON public.settings FROM anon, authenticated;
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;

-- 10. Checkout Function Grant
GRANT EXECUTE ON FUNCTION public.create_checkout_order(text, text, text, jsonb, numeric) TO anon, authenticated;


-- ====================================================================
-- VERIFICATION SCRIPT (Execute in Supabase SQL Editor to test & verify)
-- ====================================================================
/*
-- 1. Verify RLS status and policy count per public table
SELECT 
    c.relname AS table_name,
    c.relrowsecurity AS rowsecurity_enabled,
    count(pol.polname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy pol ON pol.polrelid = c.oid
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- 2. List all policies across public tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Anonymous role security test transaction (with rollback)
BEGIN;

  -- Switch to unauthenticated anon role
  SET LOCAL ROLE anon;

  -- Test A: Select from orders MUST return 0 rows (no read access for anon)
  DO $$
  DECLARE
    v_count int;
  BEGIN
    SELECT count(*) INTO v_count FROM public.orders;
    IF v_count <> 0 THEN
      RAISE EXCEPTION 'SECURITY BREACH: Anonymous role was able to read % orders!', v_count;
    END IF;
    RAISE NOTICE 'TEST A PASSED: Anonymous select returned 0 rows.';
  END;
  $$;

  -- Test B: Insert into orders with valid pending order MUST succeed
  DO $$
  DECLARE
    v_inserted_id uuid;
  BEGIN
    INSERT INTO public.orders (
      customer_name,
      customer_phone,
      delivery_address,
      items,
      total_price,
      status,
      whatsapp_sent_at
    ) VALUES (
      'Verification Customer',
      '03001234567',
      'Test Address, Lahore',
      '[{"name_en":"Test Phone","price":50000,"quantity":1}]'::jsonb,
      50000,
      'pending',
      NULL
    )
    RETURNING id INTO v_inserted_id;

    RAISE NOTICE 'TEST B PASSED: Anonymous insert succeeded with ID %', v_inserted_id;
  END;
  $$;

  -- Test C: Insert with forged status ('confirmed') MUST fail due to RLS WITH CHECK
  DO $$
  BEGIN
    BEGIN
      INSERT INTO public.orders (
        customer_name,
        customer_phone,
        delivery_address,
        items,
        total_price,
        status,
        whatsapp_sent_at
      ) VALUES (
        'Hacker Order',
        '03001234567',
        'Fake Address',
        '[]'::jsonb,
        100,
        'confirmed',
        NULL
      );
      RAISE EXCEPTION 'SECURITY BREACH: Anonymous insert with status=confirmed should have failed!';
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE 'TEST C PASSED: Forged status was successfully blocked by RLS.';
    END;
  END;
  $$;

  -- Test D: Insert with forged whatsapp_sent_at MUST fail due to RLS WITH CHECK
  DO $$
  BEGIN
    BEGIN
      INSERT INTO public.orders (
        customer_name,
        customer_phone,
        delivery_address,
        items,
        total_price,
        status,
        whatsapp_sent_at
      ) VALUES (
        'Hacker Order',
        '03001234567',
        'Fake Address',
        '[]'::jsonb,
        100,
        'pending',
        NOW()
      );
      RAISE EXCEPTION 'SECURITY BREACH: Anonymous insert with non-null whatsapp_sent_at should have failed!';
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE 'TEST D PASSED: Forged whatsapp_sent_at was successfully blocked by RLS.';
    END;
  END;
  $$;

  -- Test E: Test Security Definer Function create_checkout_order
  DO $$
  DECLARE
    v_rpc_id uuid;
  BEGIN
    v_rpc_id := public.create_checkout_order(
      'Anon Buyer via RPC',
      '03123456789',
      'Shop Delivery Address',
      '[{"name_en":"Case","price":1500,"quantity":1}]'::jsonb,
      1500
    );
    RAISE NOTICE 'TEST E PASSED: create_checkout_order returned order UUID %', v_rpc_id;
  END;
  $$;

-- Rollback all test data so nothing remains
ROLLBACK;
*/
