-- 1. Add email column to profiles (if not exists)
alter table public.profiles 
add column if not exists email text;

-- 2. Backfill email from auth.users (requires suitable permissions, otherwise manual or via edge function is safer, but this works in SQL Editor)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;

-- 3. Create business_members table
create table if not exists public.business_members (
    id uuid default gen_random_uuid() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text default 'editor' check (role in ('owner', 'editor', 'viewer')),
    created_at timestamp with time zone default now(),
    unique(business_id, user_id)
);

-- 4. Enable RLS
alter table public.business_members enable row level security;

-- 5. RLS Policies for business_members

-- A user can view members of businesses they are a member of
create policy "Users can view members of their businesses"
on public.business_members for select
using (
    auth.uid() in (
        select user_id from public.business_members where business_id = business_members.business_id
    )
    or
    exists (
        select 1 from public.businesses where id = business_members.business_id and owner_id = auth.uid()
    )
);

-- Only owners can add/remove members (simplified: owner of the business)
create policy "Owners can manage members"
on public.business_members for all
using (
    exists (
        select 1 from public.businesses where id = business_members.business_id and owner_id = auth.uid()
    )
);

-- 6. Update Businesses RLS to allow members to view/edit
-- (Checking if policy exists first to avoid error, or just using "create or replace" logic if possible, but standard SQL doesn't support "create policy if not exists" easily in one block without DO block)

do $$
begin
  -- Allow members to VIEW business details
  if not exists (select 1 from pg_policies where policyname = 'Members can view business details') then
      create policy "Members can view business details" on public.businesses for select
      using (
          auth.uid() = owner_id
          or
          exists (select 1 from public.business_members where business_id = businesses.id and user_id = auth.uid())
      );
  end if;
  
  -- Update existing "Users can view their own businesses" if needed, but adding a new permissive policy is usually easier.
end $$;

-- 7. Update Sync Trigger to keep email updated (Optional but good)
create or replace function public.handle_user_update()
returns trigger as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_update();
