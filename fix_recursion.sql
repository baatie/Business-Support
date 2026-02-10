-- ==========================================
-- FIX RECURSION IN RLS POLICIES
-- ==========================================

-- 1. Create a Helper Function (Security Definer)
-- This allows us to check membership without triggering infinite RLS loops
create or replace function public.is_business_member(_business_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.business_members 
    where business_id = _business_id 
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 2. Drop the buggy policy
drop policy if exists "Users can view members of their businesses" on public.business_members;

-- 3. Create the corrected policy
create policy "Users can view members of their businesses" on public.business_members for select
using (
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- Business Owner can see all members
    exists (select 1 from public.businesses where id = business_members.business_id and owner_id = auth.uid())
    OR
    -- Members can see other members (using the safe function)
    public.is_business_member(business_id)
);
