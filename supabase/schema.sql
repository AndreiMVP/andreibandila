-- Supabase schema for the custom CMS.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Legacy JSON CMS table from the earlier admin version. The current admin uses
-- first-class tables below.
drop table if exists public.content_entries;

create table if not exists public.albums (
  id text primary key,
  title text not null,
  subtitle text default '',
  year text default '',
  location text default '',
  description text default '',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id text not null references public.albums(id) on delete cascade,
  src text not null,
  caption text default '',
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  width integer,
  height integer,
  blur_data_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe for existing projects: `create table if not exists` does not add
-- columns to already-created tables.
alter table public.albums
  add column if not exists published boolean not null default true;

alter table public.album_photos
  add column if not exists is_cover boolean not null default false,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists blur_data_url text default '';

create table if not exists public.films (
  id text primary key,
  title text not null,
  subtitle text default '',
  year text default '',
  role text default '',
  description text default '',
  cover text default '',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe for existing projects: keep old `films` tables in sync with the
-- current admin/public app shape.
alter table public.films
  add column if not exists subtitle text default '',
  add column if not exists year text default '',
  add column if not exists role text default '',
  add column if not exists description text default '',
  add column if not exists cover text default '',
  add column if not exists published boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.journal_entries (
  id text primary key,
  title text not null,
  content text default '',
  image text default '',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries
  add column if not exists published boolean not null default true,
  drop column if exists image_caption;

create table if not exists public.about_page (
  id boolean primary key default true check (id),
  portrait_image text default '',
  content text default '',
  updated_at timestamptz not null default now()
);

alter table public.about_page
  drop column if exists cv_items,
  drop column if exists contact_email,
  drop column if exists contact_location,
  drop column if exists social_instagram,
  drop column if exists social_vimeo,
  drop column if exists social_substack;

create table if not exists public.about_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.about_page (id) values (true) on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'albums_id_slug_check') then
    alter table public.albums add constraint albums_id_slug_check check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'films_id_slug_check') then
    alter table public.films add constraint films_id_slug_check check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'journal_entries_id_slug_check') then
    alter table public.journal_entries add constraint journal_entries_id_slug_check check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$') not valid;
  end if;
end $$;

create or replace function public.prevent_public_id_update()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Public slugs are immutable after creation.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_albums_id_update on public.albums;
create trigger prevent_albums_id_update before update of id on public.albums for each row execute function public.prevent_public_id_update();

drop trigger if exists prevent_films_id_update on public.films;
create trigger prevent_films_id_update before update of id on public.films for each row execute function public.prevent_public_id_update();

drop trigger if exists prevent_journal_entries_id_update on public.journal_entries;
create trigger prevent_journal_entries_id_update before update of id on public.journal_entries for each row execute function public.prevent_public_id_update();

create or replace function public.set_album_cover(p_album_id text, p_photo_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  if not exists (select 1 from public.album_photos where id = p_photo_id and album_id = p_album_id) then
    raise exception 'Album photo not found.';
  end if;

  update public.album_photos
  set is_cover = false, updated_at = now()
  where album_id = p_album_id;

  update public.album_photos
  set is_cover = true, updated_at = now()
  where id = p_photo_id and album_id = p_album_id;
end;
$$;

create or replace function public.reorder_album_photos(p_photo_ids uuid[])
returns setof public.album_photos
language plpgsql
security invoker
as $$
begin
  update public.album_photos photo
  set sort_order = ordered.sort_order, updated_at = now()
  from (
    select id, (ordinality::integer - 1) as sort_order
    from unnest(p_photo_ids) with ordinality as item(id, ordinality)
  ) as ordered
  where photo.id = ordered.id;

  return query
  select photo.*
  from public.album_photos photo
  join unnest(p_photo_ids) with ordinality as item(id, ordinality) on photo.id = item.id
  order by item.ordinality;
end;
$$;

create or replace function public.reorder_content_items(p_table text, p_ids text[])
returns void
language plpgsql
security invoker
as $$
begin
  if p_table not in ('albums', 'films', 'journal_entries') then
    raise exception 'Unsupported reorder table: %', p_table;
  end if;

  execute format($sql$
    update public.%I item
    set sort_order = ordered.sort_order, updated_at = now()
    from (
      select id, (ordinality::integer - 1) as sort_order
      from unnest($1::text[]) with ordinality as entry(id, ordinality)
    ) as ordered
    where item.id = ordered.id
  $sql$, p_table) using p_ids;
end;
$$;

create or replace function public.sync_about_sections(p_sections jsonb)
returns setof public.about_sections
language plpgsql
security invoker
as $$
begin
  delete from public.about_sections section
  where not exists (
    select 1
    from jsonb_array_elements(p_sections) as item(value)
    where section.id = (item.value->>'id')::uuid
  );

  insert into public.about_sections (id, title, body, sort_order, updated_at)
  select
    (item.value->>'id')::uuid,
    item.value->>'title',
    coalesce(item.value->>'body', ''),
    coalesce((item.value->>'sort_order')::integer, 0),
    now()
  from jsonb_array_elements(p_sections) as item(value)
  on conflict (id) do update set
    title = excluded.title,
    body = excluded.body,
    sort_order = excluded.sort_order,
    updated_at = now();

  return query select * from public.about_sections order by sort_order;
end;
$$;

alter table public.admin_users enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;
alter table public.films enable row level security;
alter table public.journal_entries enable row level security;
alter table public.about_page enable row level security;
alter table public.about_sections enable row level security;

drop policy if exists "Admins can read their own admin row" on public.admin_users;
create policy "Admins can read their own admin row" on public.admin_users
  for select using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['albums','album_photos','films','journal_entries','about_page','about_sections'] loop
    execute format('drop policy if exists "Public can read %s" on public.%I', t, t);
    execute format('drop policy if exists "Authenticated users can manage %s" on public.%I', t, t);
    execute format('drop policy if exists "Admins can manage %s" on public.%I', t, t);
    execute format('create policy "Admins can manage %s" on public.%I for all using (exists (select 1 from public.admin_users where user_id = auth.uid())) with check (exists (select 1 from public.admin_users where user_id = auth.uid()))', t, t);
  end loop;
end $$;

drop policy if exists "Public can read published albums" on public.albums;
create policy "Public can read published albums" on public.albums
  for select using (published = true);

drop policy if exists "Public can read photos from published albums" on public.album_photos;
create policy "Public can read photos from published albums" on public.album_photos
  for select using (exists (select 1 from public.albums where albums.id = album_photos.album_id and albums.published = true));

drop policy if exists "Public can read published films" on public.films;
create policy "Public can read published films" on public.films
  for select using (published = true);

drop policy if exists "Public can read published journal entries" on public.journal_entries;
create policy "Public can read published journal entries" on public.journal_entries
  for select using (published = true);

drop policy if exists "Public can read about page" on public.about_page;
create policy "Public can read about page" on public.about_page
  for select using (true);

drop policy if exists "Public can read about sections" on public.about_sections;
create policy "Public can read about sections" on public.about_sections
  for select using (true);

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read photos" on storage.objects;
create policy "Public can read photos" on storage.objects for select using (bucket_id = 'photos');

drop policy if exists "Authenticated users can manage photos" on storage.objects;
drop policy if exists "Admins can manage photos" on storage.objects;
create policy "Admins can manage photos"
  on storage.objects for all
  using (bucket_id = 'photos' and exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (bucket_id = 'photos' and exists (select 1 from public.admin_users where user_id = auth.uid()));

notify pgrst, 'reload schema';
