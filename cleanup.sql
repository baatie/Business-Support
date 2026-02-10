-- ==========================================
-- 1. CLEANUP "GHOST" BUSINESSES
-- ==========================================

-- Delete businesses with no name (created during failed attempts)
delete from public.businesses where name is null or name = '';

-- ==========================================
-- 2. UPDATE FEATURE TABLES TO USE NEW RLS
-- (Customers, Invoices, Expenses, Projects)
-- ==========================================

-- A. CUSTOMERS
drop policy if exists "Users can manage customers for their businesses" on public.customers;
create policy "Users can manage customers for their businesses" on public.customers for all
using (
  -- Owner OR Member
  (select owner_id from public.businesses where id = business_id) = auth.uid()
  OR
  public.check_is_member(business_id)
);

-- B. INVOICES
drop policy if exists "Users can manage invoices for their businesses" on public.invoices;
create policy "Users can manage invoices for their businesses" on public.invoices for all
using (
  (select owner_id from public.businesses where id = business_id) = auth.uid()
  OR
  public.check_is_member(business_id)
);

-- C. EXPENSES
drop policy if exists "Users can manage expenses for their businesses" on public.expenses;
create policy "Users can manage expenses for their businesses" on public.expenses for all
using (
  (select owner_id from public.businesses where id = business_id) = auth.uid()
  OR
  public.check_is_member(business_id)
);

-- D. PROJECTS
drop policy if exists "Users can manage projects for their businesses" on public.projects;
create policy "Users can manage projects for their businesses" on public.projects for all
using (
  (select owner_id from public.businesses where id = business_id) = auth.uid()
  OR
  public.check_is_member(business_id)
);

-- E. INVOICE ITEMS (Detail table)
drop policy if exists "Users can manage invoice items for their businesses" on public.invoice_items;
create policy "Users can manage invoice items for their businesses" on public.invoice_items for all
using (
  exists (
    select 1 from public.invoices
    where id = invoice_id
    and (
      (select owner_id from public.businesses where id = business_id) = auth.uid()
      OR
      public.check_is_member(business_id)
    )
  )
);
