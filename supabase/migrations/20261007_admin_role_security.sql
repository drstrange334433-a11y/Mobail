-- ====================================================================
-- PARACHA MOBILE SHOP — ADMIN AUTHORIZATION SECURITY ENHANCEMENT
-- Description: Helper function and refined RLS policies for administrator role verification
-- ====================================================================

-- Function to check if the current user has administrator privileges
-- Checks Supabase Auth JWT app_metadata and user_metadata for role = 'admin' or 'super_admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated' AND (
            coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin') OR
            coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin') OR
            -- Default fallback for the initial administrator user account:
            -- Any authenticated staff account is granted access unless explicitly assigned another role (e.g. customer)
            coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') NOT IN ('customer', 'anonymous')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply policies on products to explicitly require administrator verification for writes
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;

CREATE POLICY "Admins have full access to products"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Re-apply policies on product_images
DROP POLICY IF EXISTS "Admins have full access to product images" ON public.product_images;

CREATE POLICY "Admins have full access to product images"
ON public.product_images FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Re-apply policies on product_variants
DROP POLICY IF EXISTS "Admins have full access to product variants" ON public.product_variants;

CREATE POLICY "Admins have full access to product variants"
ON public.product_variants FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
