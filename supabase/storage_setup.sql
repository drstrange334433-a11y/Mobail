-- ====================================================================
-- PARACHA MOBILE SHOP — SUPABASE STORAGE SETUP FOUNDATION
-- Buckets:
--   1. product-images: High-res and gallery pictures of mobile phones & accessories
--   2. brand-logos: Official logos for Samsung, Apple, Xiaomi, Vivo, etc.
--   3. banners: Promotional slides and hero advertising graphics
--   4. category-icons: Visual icons for mobile, tablet, audio, chargers, etc.
-- ====================================================================

-- Insert standard buckets if not existing
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-images', 'product-images', true),
    ('brand-logos', 'brand-logos', true),
    ('banners', 'banners', true),
    ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: Public Read Access for all 4 buckets
CREATE POLICY "Public Read Product Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('product-images', 'brand-logos', 'banners', 'category-icons'));

-- Storage Policy: Authenticated Admins can upload files
CREATE POLICY "Admin Upload Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('product-images', 'brand-logos', 'banners', 'category-icons'));

-- Storage Policy: Authenticated Admins can update files
CREATE POLICY "Admin Update Files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('product-images', 'brand-logos', 'banners', 'category-icons'));

-- Storage Policy: Authenticated Admins can delete files
CREATE POLICY "Admin Delete Files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('product-images', 'brand-logos', 'banners', 'category-icons'));
