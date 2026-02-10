-- ==========================================
-- REFINEMENTS SCHEMA UPDATE
-- ==========================================

-- 1. EXPENSE CATEGORIES
-- Custom categories per business
create table if not exists public.expense_categories (
    id uuid default gen_random_uuid() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    name text not null,
    is_default boolean default false,
    created_at timestamp with time zone default now()
);

alter table public.expense_categories enable row level security;

create policy "Users can view expense categories" on public.expense_categories for select
using (
  (select owner_id from public.businesses where id = business_id) = auth.uid()
  OR
  public.check_is_member(business_id)
);

create policy "Users can manage expense categories" on public.expense_categories for all
using (
  (select owner_id from public.businesses where id = business_id) = auth.uid()
  OR
  public.check_is_member(business_id)
);

-- 2. CUSTOMER CONTACTS
-- Multiple billing contacts per customer
create table if not exists public.customer_contacts (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade not null,
    name text not null,
    email text,
    phone text,
    role text, -- e.g. 'Billing', 'Primary'
    created_at timestamp with time zone default now()
);

alter table public.customer_contacts enable row level security;

create policy "Users can manage customer contacts" on public.customer_contacts for all
using (
  exists (
    select 1 from public.customers
    where id = customer_contacts.customer_id
    and (
        (select owner_id from public.businesses where id = customers.business_id) = auth.uid()
        OR
        public.check_is_member(customers.business_id)
    )
  )
);

-- 3. INVOICE PAYMENTS
-- Track partial/full payments
create table if not exists public.invoice_payments (
    id uuid default gen_random_uuid() primary key,
    invoice_id uuid references public.invoices(id) on delete cascade not null,
    amount numeric not null,
    payment_date date default now(),
    method text, -- 'Credit Card', 'Check', 'Bank Transfer'
    notes text,
    created_at timestamp with time zone default now()
);

alter table public.invoice_payments enable row level security;

create policy "Users can manage invoice payments" on public.invoice_payments for all
using (
  exists (
    select 1 from public.invoices
    where id = invoice_payments.invoice_id
    and (
        (select owner_id from public.businesses where id = invoices.business_id) = auth.uid()
        OR
        public.check_is_member(invoices.business_id)
    )
  )
);

-- 4. UPDATE INVOICES TABLE
-- Add tax_rate and contact_id
alter table public.invoices 
add column if not exists tax_rate numeric default 0,
add column if not exists contact_id uuid references public.customer_contacts(id) on delete set null;

-- 5. UPDATE EXPENSES TABLE
-- Add receipt_url and invoice_id (link to invoice)
alter table public.expenses 
add column if not exists receipt_url text,
add column if not exists invoice_id uuid references public.invoices(id) on delete set null;
