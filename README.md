# Andrei Bândilă portfolio

Next.js monorepo for the public portfolio and the custom Supabase-backed CMS.

## Apps

- Public site: root `app/`
- Admin CMS: `apps/admin/`
- Shared types: `packages/shared/`
- Supabase schema/setup: `supabase/`

## Development

```bash
cp .env.example .env.local
cp apps/admin/.env.example apps/admin/.env.local
bun install
bun run dev
bun run dev:admin
```

The public site reads portfolio content from Supabase. It no longer falls back to local JSON content; if Supabase is missing/unavailable, content lists render empty. Email and social links remain hardcoded.

## Build

```bash
bun run build
bun run build:admin
```
