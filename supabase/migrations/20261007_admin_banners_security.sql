-- ====================================================================
-- PARACHA MOBILE SHOP — BANNERS ADMIN SECURITY ENHANCEMENT
-- Description: Enforce administrator verification on banner mutations
--              and ensure storage policies for banners bucket
-- ====================================================================

-- Re-apply policies on banners to explicitly require is_admin() verification for writes
DROP POLICY IF EXISTS "Admins have full access to banners" ON public.banners;

CREATE POLICY "Admins have full access to banners"
ON public.banners FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Ensure public read policy remains active
DROP POLICY IF EXISTS "Public users can view active banners" ON public.banners;

CREATE POLICY "Public users can view active banners"
ON public.banners FOR SELECT
TO public
USING (is_active = true);

-- Performance index for active banners ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_banners_active_sort ON public.banners(is_active, sort_order);
