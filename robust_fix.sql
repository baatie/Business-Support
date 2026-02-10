-- ==========================================
-- ROBUST FIX FOR RLS RECURSION (The "Dual Function" Method)
-- ==========================================

-- 1. DROP ALL PREVIOUS POLICIES
drop policy if exists "Users can view members of their businesses" on public.business_members;
drop policy if exists "Owners can manage members" on public.business_members;
drop policy if exists "View business members" on public.business_members;
drop policy if exists "Manage business members" on public.business_members;

drop policy if exists "Members can view business details" on public.businesses;
drop policy if exists "Users can view their own businesses" on public.businesses;
drop policy if exists "Access businesses" on public.businesses;
drop policy if exists "Insert businesses" on public.businesses;
drop policy if exists "Update businesses" on public.businesses;
drop policy if exists "Delete businesses" on public.businesses;

-- 2. DROP OLD FUNCTIONS (Clean Slate)
drop function if exists public.is_business_member;
drop function if exists public.is_member_of_business;
drop function if exists public.is_business_owner; 
-- (Dropping potential name conflicts)

-- 3. FUNCTION A: Check Membership (Used by Businesses Table)
-- Returns TRUE if auth.uid() is in business_members
create or replace function public.check_is_member(_business_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public -- Vital for security
as $$
begin
  return exists (
    select 1 
    from public.business_members 
    where business_id = _business_id 
    and user_id = auth.uid()
  );
end;
$$;

-- 4. FUNCTION B: Check Ownership (Used by Business Members Table)
-- Returns TRUE if auth.uid() is owner of business
create or replace function public.check_is_owner(_business_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public -- Vital for security
as $$
begin
  return exists (
    select 1 
    from public.businesses 
    where id = _business_id 
    and owner_id = auth.uid()
  );
end;
$$;

-- 5. POLICIES FOR BUSINESSES
-- Select: Owner OR Member (via safe function)
create policy "Access businesses" on public.businesses for select
using (
  owner_id = auth.uid() 
  OR 
  public.check_is_member(id)
);

-- Insert: Authenticated users can create (Check owner only)
create policy "Insert businesses" on public.businesses for insert
with check (
  auth.uid() = owner_id
);

-- Update/Delete: Owner Only
create policy "Update businesses" on public.businesses for update
using (owner_id = auth.uid());

create policy "Delete businesses" on public.businesses for delete
using (owner_id = auth.uid());

-- 6. POLICIES FOR BUSINESS MEMBERS
-- Select: Member (seeing self) OR Owner (seeing all)
-- Uses safe function to check ownership to avoid loop
create policy "View business members" on public.business_members for select
using (
  user_id = auth.uid()
  OR
  public.check_is_owner(business_id)
);

-- Manage: Owner Only (via safe function)
create policy "Manage business members" on public.business_members for all
using (
  public.check_is_owner(business_id)
);
