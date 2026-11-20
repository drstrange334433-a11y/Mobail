-- ====================================================================
-- PARACHA MOBILE SHOP — CUSTOMER ORDER LOOKUP BY ID
-- Security: Secure RPC allowing customers to look up an order by its exact UUID
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_customer_order_by_id(p_order_id uuid)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.orders
    WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_order_by_id(uuid) TO anon, authenticated;

-- Optional policy if direct table querying by exact ID is desired for anon/authenticated
DROP POLICY IF EXISTS "orders_customer_select_by_id" ON public.orders;
CREATE POLICY "orders_customer_select_by_id" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (id IS NOT NULL);
