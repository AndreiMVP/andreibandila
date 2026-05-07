# Supabase CMS setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Create an admin user in Supabase Auth:
   - Authentication → Users → Add user
4. Allow that user to manage content by inserting it into `admin_users`:

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'you@example.com'
on conflict (user_id) do nothing;
```

Only rows present in `admin_users` can write CMS tables or upload/delete storage objects. Public visitors can only read published content.

5. Copy env examples and fill the values:

```bash
# public app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://andreibandila.ro
SUPABASE_SERVICE_ROLE_KEY= # only needed for seed/upload scripts

# admin app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://andreibandila.ro
```

6. Optional: seed legacy JSON content into Supabase.

By default this seeds only a small sample of each gallery:

```bash
bun run seed:supabase
```

To seed full galleries later:

```bash
bun run seed:supabase:all
```

7. Optional: upload the sampled local images to Supabase Storage and rewrite image URLs in Supabase content:

```bash
bun run upload:supabase-photos
```

To upload every local image referenced by content:

```bash
bun run upload:supabase-photos:all
```

8. Start the site and admin app:

```bash
bun run dev
bun run dev:admin
```

The public website reads only from Supabase CMS tables: `albums`, `album_photos`, `films`, `journal_entries`, `about_page`, and `about_sections`. If Supabase is not configured or queries fail, the public content areas are empty rather than falling back to hardcoded JSON.

Album photos store optional `width`, `height`, and `blur_data_url` metadata. New admin uploads populate these automatically; seeded local photos get dimensions when possible.

Email and social links remain hardcoded in the public app.
