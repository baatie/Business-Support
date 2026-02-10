-- ==========================================
-- FINAL FIX FOR INFINITE RECURSION
-- ==========================================

-- 1. DROP ALL EXISTING POLICIES (Start Fresh)
drop policy if exists "Users can view members of their businesses" on public.business_members;
drop policy if exists "Owners can manage members" on public.business_members;
drop policy if exists "Members can view business details" on public.businesses;
drop policy if exists "Users can view their own businesses" on public.businesses;
drop policy if exists "Users can insert their own business" on public.businesses;
drop policy if exists "Users can update their own business" on public.businesses;
drop policy if exists "Users can delete their own business" on public.businesses;

-- 2. CREATE HELPER FUNCTION (To break recursion)
-- This function accesses the tables directly with a security definer, bypassing RLS
create or replace function public.is_member_of_business(_business_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 
    from public.business_members 
    where business_id = _business_id 
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 3. POLICIES FOR BUSINESSES
-- A. View: Owners OR Members (via secure function)
create policy "Access businesses" on public.businesses for select
using (
  owner_id = auth.uid() 
  OR 
  public.is_member_of_business(id)
);

-- B. Insert: Authenticated users can create businesses
create policy "Insert businesses" on public.businesses for insert
with check (
  auth.uid() = owner_id
);

-- C. Update: Owners Only
create policy "Update businesses" on public.businesses for update
using (
  owner_id = auth.uid()
);

-- D. Delete: Owners Only
create policy "Delete businesses" on public.businesses for delete
using (
  owner_id = auth.uid()
);


-- 4. POLICIES FOR BUSINESS MEMBERS
-- A. View: Members can see other members of the SAME business
create policy "View business members" on public.business_members for select
using (
  -- I am the member
  user_id = auth.uid()
  OR
  -- I am the owner of the business
  exists (
    select 1 from public.businesses 
    where id = business_members.business_id 
    and owner_id = auth.uid()
  )
  OR
  -- I am a member of the business (recursion breaker)
  public.is_member_of_business(business_id)
);

-- B. Manage: Owners Only (Insert/Update/Delete)
create policy "Manage business members" on public.business_members for all
using (
  exists (
    select 1 from public.businesses 
    where id = business_members.business_id 
    and owner_id = auth.uid()
  )
);
