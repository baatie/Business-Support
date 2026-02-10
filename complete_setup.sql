-- ==========================================
-- 1. FIX PROFILES (Required for Auth/Business)
-- ==========================================

-- A. Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text
);

-- B. VITAL FIX: Add email column if it doesn't exist (This was missing in the previous script!)
alter table public.profiles 
add column if not exists email text;

-- C. Enable RLS
alter table public.profiles enable row level security;

-- D. Create RLS policies (using DO block to avoid errors if they exist)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public profiles are viewable by everyone.') then
    create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert their own profile.') then
    create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own profile.') then
    create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );
  end if;
end $$;

-- E. Create/Update the trigger function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- F. Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- G. BACKFILL: Fix existing users who are missing profiles
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles);

-- H. BACKFILL: Update emails for existing profiles that represent a user but have null email
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;


-- ==========================================
-- 2. SETUP BUSINESS SHARING
-- ==========================================

-- A. Create business_members table
create table if not exists public.business_members (
    id uuid default gen_random_uuid() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text default 'editor' check (role in ('owner', 'editor', 'viewer')),
    created_at timestamp with time zone default now(),
    unique(business_id, user_id)
);

-- B. Enable RLS
alter table public.business_members enable row level security;

-- C. RLS Policies for business_members
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view members of their businesses') then
    create policy "Users can view members of their businesses" on public.business_members for select
    using (
        auth.uid() in (select user_id from public.business_members where business_id = business_members.business_id)
        or
        exists (select 1 from public.businesses where id = business_members.business_id and owner_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Owners can manage members') then
    create policy "Owners can manage members" on public.business_members for all
    using (
        exists (select 1 from public.businesses where id = business_members.business_id and owner_id = auth.uid())
    );
  end if;
  
  -- Allow Members to View Business Data
  if not exists (select 1 from pg_policies where policyname = 'Members can view business details') then
      create policy "Members can view business details" on public.businesses for select
      using (
          auth.uid() = owner_id
          or
          exists (select 1 from public.business_members where business_id = businesses.id and user_id = auth.uid())
      );
  end if;
end $$;

-- D. Keep emails in sync on update
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
