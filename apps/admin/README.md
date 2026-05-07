# Admin app

Separate Next.js app for the Supabase CMS.

Run locally:

```bash
cd ../..
bun run dev:admin
```

The admin runs on port `3001` by default.

Required env vars, either in `apps/admin/.env.local` or deployment env:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Shared content/admin types live in `packages/shared` and are imported as `@andreibandila/shared`.

Only Supabase Auth users present in `public.admin_users` can manage CMS content. Public pages use ISR and pick up CMS changes on their next revalidation window.
