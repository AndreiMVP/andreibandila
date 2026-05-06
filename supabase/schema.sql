-- Supabase schema for the custom CMS.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  collection text not null check (collection in ('albums', 'films', 'journal', 'settings')),
  slug text not null,
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection, slug)
);

alter table public.content_entries enable row level security;

-- Public website can read published content.
drop policy if exists "Public can read content" on public.content_entries;
create policy "Public can read content"
  on public.content_entries for select
  using (true);

-- Authenticated admin users can manage content.
drop policy if exists "Authenticated users can manage content" on public.content_entries;
create policy "Authenticated users can manage content"
  on public.content_entries for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- Anyone can view images in the public photos bucket.
drop policy if exists "Public can read photos" on storage.objects;
create policy "Public can read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

-- Authenticated admin users can upload/update/delete images.
drop policy if exists "Authenticated users can manage photos" on storage.objects;
create policy "Authenticated users can manage photos"
  on storage.objects for all
  using (bucket_id = 'photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');
