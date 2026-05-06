# Content CMS

The public site reads portfolio content from JSON files in this folder at build time.

- `albums/*.json` — photo album pages
- `films/*.json` — film pages
- `journal/*.json` — journal/articles
- `about.json` — biography paragraphs

Photos used by the site live in `public/photos`. New uploads from the admin UI are configured to go to `public/photos/uploads` and are referenced as `/photos/uploads/...` in JSON.

## Admin editor

A Decap CMS admin is available at `/admin`.

Local editing:

```bash
npx decap-server
bun run dev
```

Then open `http://localhost:3000/admin`.

Production needs a Git backend/auth provider configured in `public/admin/config.yml` so edits can be committed to the repository and trigger a rebuild.
