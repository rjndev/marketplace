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

create policy "listings are public" on public.listings for select using (true);
create policy "anyone can create listings" on public.listings for insert with check (true);
-- Messages are insert-only so seller email/messages are never readable via the anon key.
create policy "anyone can send messages" on public.messages for insert with check (true);

alter publication supabase_realtime add table public.listings;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "listing images are public" on storage.objects for select using (bucket_id = 'listing-images');
create policy "anyone can upload listing images" on storage.objects for insert with check (bucket_id = 'listing-images');
