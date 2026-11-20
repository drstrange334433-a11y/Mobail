-- ====================================================================
-- PARACHA MOBILE SHOP — TESTIMONIALS ADMIN SECURITY & SCHEMA ENHANCEMENT
-- Description: Admins check function, testimonials schema with strict check
--              constraints, performance indexes, RLS policies, and table grants.
-- ====================================================================

-- 1) Admins table + check function
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 2) Testimonials table
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 100),
  review_en text not null check (char_length(trim(review_en)) between 1 and 1000),
  review_ur text check (review_ur is null or char_length(review_ur) <= 1000),
  rating integer not null check (rating between 1 and 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists testimonials_active_created_idx
  on public.testimonials (is_active, created_at desc);

-- 3) RLS + policies
alter table public.testimonials enable row level security;

-- Drop legacy/alternate policy names if any exist
drop policy if exists "Public users can view active testimonials" on public.testimonials;
drop policy if exists "Admins have full access to testimonials" on public.testimonials;
drop policy if exists "Public can view active testimonials" on public.testimonials;
drop policy if exists "Admins can manage testimonials" on public.testimonials;
drop policy if exists "Admins can view all testimonials" on public.testimonials;
drop policy if exists "Admins can insert testimonials" on public.testimonials;
drop policy if exists "Admins can update testimonials" on public.testimonials;
drop policy if exists "Admins can delete testimonials" on public.testimonials;

-- User specified policy drops
drop policy if exists "testimonials_public_select" on public.testimonials;
drop policy if exists "testimonials_admin_select" on public.testimonials;
drop policy if exists "testimonials_admin_insert" on public.testimonials;
drop policy if exists "testimonials_admin_update" on public.testimonials;
drop policy if exists "testimonials_admin_delete" on public.testimonials;

create policy "testimonials_public_select" on public.testimonials
  for select to anon, authenticated using (is_active = true);

create policy "testimonials_admin_select" on public.testimonials
  for select to authenticated using (public.is_admin());

create policy "testimonials_admin_insert" on public.testimonials
  for insert to authenticated with check (public.is_admin());

create policy "testimonials_admin_update" on public.testimonials
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "testimonials_admin_delete" on public.testimonials
  for delete to authenticated using (public.is_admin());

-- 4) Grants
revoke all on public.testimonials from anon;
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
