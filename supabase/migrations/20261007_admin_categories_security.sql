-- ====================================================================
-- PARACHA MOBILE SHOP — CATEGORIES ADMIN SECURITY ENHANCEMENT
-- Description: Enforce administrator verification on category mutations
-- ====================================================================

-- Re-apply policies on categories to explicitly require is_admin() verification for writes
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;

CREATE POLICY "Admins have full access to categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
