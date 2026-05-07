# Legacy seed content

The public site no longer reads these JSON files directly. They are kept only as legacy source material for the optional Supabase seed/upload scripts:

```bash
bun run seed:supabase
bun run upload:supabase-photos
```

Runtime content comes from Supabase CMS tables. See `supabase/README.md`.
