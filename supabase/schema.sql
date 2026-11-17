create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) <= 5000),
  price numeric(12, 2) not null check (price >= 0),
  email text not null check (char_length(email) <= 254),
  category text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_category_idx on public.listings (category);

alter table public.listings enable row level security;
alter table public.messages enable row level security;

drop policy if exists "listings are public" on public.listings;
create policy "listings are public" on public.listings for select using (true);
drop policy if exists "anyone can create listings" on public.listings;
create policy "anyone can create listings" on public.listings for insert with check (true);
-- Messages are insert-only so seller email/messages are never readable via the anon key.
drop policy if exists "anyone can send messages" on public.messages;
create policy "anyone can send messages" on public.messages for insert with check (true);

do $$ begin
  alter publication supabase_realtime add table public.listings;
exception when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "listing images are public" on storage.objects;
create policy "listing images are public" on storage.objects for select using (bucket_id = 'listing-images');
drop policy if exists "anyone can upload listing images" on storage.objects;
create policy "anyone can upload listing images" on storage.objects for insert with check (bucket_id = 'listing-images');

-- Stripe Connect payments ------------------------------------------------
alter table public.listings add column if not exists status text not null default 'available' check (status in ('available', 'sold'));
alter table public.listings add column if not exists seller_ready boolean not null default false;

create table if not exists public.sellers (
  email text primary key,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  stripe_session_id text not null unique,
  seller_account_id text not null,
  buyer_email text,
  amount_total integer not null,
  application_fee integer not null,
  created_at timestamptz not null default now()
);

-- No policies: only the service-role key can read or write these tables.
alter table public.sellers enable row level security;
alter table public.orders enable row level security;

create or replace function public.listings_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.status := 'available';
  new.seller_ready := coalesce((select charges_enabled from public.sellers where email = lower(new.email)), false);
  return new;
end $$;

drop trigger if exists listings_before_insert on public.listings;
create trigger listings_before_insert before insert on public.listings
  for each row execute function public.listings_before_insert();

create or replace function public.sellers_sync_listings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.listings set seller_ready = new.charges_enabled where lower(email) = new.email;
  return new;
end $$;

drop trigger if exists sellers_sync_listings on public.sellers;
create trigger sellers_sync_listings after insert or update of charges_enabled on public.sellers
  for each row execute function public.sellers_sync_listings();
