# Supabase CMS setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Create an admin user in Supabase Auth:
   - Authentication → Users → Add user
4. Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

5. Seed current JSON content into Supabase.

By default this seeds only a small sample of each gallery, so you do not upload/reference too many large images while testing:

```bash
bun run seed:supabase
```

To seed full galleries later:

```bash
bun run seed:supabase:all
```

6. Optional: upload the sampled local images to Supabase Storage and rewrite image URLs in Supabase content:

```bash
bun run upload:supabase-photos
```

To upload every local image referenced by content:

```bash
bun run upload:supabase-photos:all
```

7. Start the site:

```bash
bun run dev
```

7. Open `/admin` and log in with the Supabase Auth user.

The public website reads from `content_entries` and falls back to local JSON files if Supabase env vars are missing or the table is empty.

Images uploaded in the admin go to the public Supabase Storage bucket named `photos`.
