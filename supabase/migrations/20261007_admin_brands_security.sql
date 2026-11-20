-- ====================================================================
-- PARACHA MOBILE SHOP — BRANDS ADMIN SECURITY ENHANCEMENT
-- Description: Enforce administrator verification on brand mutations
-- ====================================================================

-- Re-apply policies on brands to explicitly require is_admin() verification for writes
DROP POLICY IF EXISTS "Admins have full access to brands" ON public.brands;

CREATE POLICY "Admins have full access to brands"
ON public.brands FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
