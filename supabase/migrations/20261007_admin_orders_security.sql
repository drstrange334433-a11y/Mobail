-- ====================================================================
-- PARACHA MOBILE SHOP — ORDERS ADMIN SECURITY ENHANCEMENT
-- Description: Enforce administrator verification on order updates & reads,
--              while keeping customer INSERT capability intact.
-- ====================================================================

-- 1. Ensure RLS is active on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop old general admin policy if exists
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;

-- 3. Dedicated Admin Full Access Policy with is_admin() verification
CREATE POLICY "Admins have full access to orders"
ON public.orders FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Retain / guarantee public checkout INSERT policy
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;

CREATE POLICY "Customers can create orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

-- 5. Performance Indexes for Orders Querying
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
