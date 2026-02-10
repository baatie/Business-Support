-- Fix invoice_payments table to match application code
-- 1. Create table if it doesn't exist (with correct columns)
create table if not exists public.invoice_payments (
    id uuid default gen_random_uuid() primary key,
    invoice_id uuid references public.invoices(id) on delete cascade not null,
    amount numeric not null,
    payment_date date default now(),
    payment_method text,
    reference_number text,
    notes text,
    created_at timestamp with time zone default now()
);

-- 2. Add columns if they are missing (for existing tables)
do $$
begin
    -- Add payment_method if missing
    if not exists (select 1 from information_schema.columns where table_name = 'invoice_payments' and column_name = 'payment_method') then
        alter table public.invoice_payments add column payment_method text;
    end if;

    -- Add reference_number if missing
    if not exists (select 1 from information_schema.columns where table_name = 'invoice_payments' and column_name = 'reference_number') then
        alter table public.invoice_payments add column reference_number text;
    end if;
end $$;

-- 3. Enable RLS
alter table public.invoice_payments enable row level security;

-- 4. recreate policies just in case
drop policy if exists "Users can manage invoice payments" on public.invoice_payments;

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
