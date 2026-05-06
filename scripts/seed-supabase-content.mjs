import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import ws from "ws";

async function loadEnvFile(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^['\"]|['\"]$/g, "");
      process.env[key] ??= value;
    }
  } catch {
    // Optional env file.
  }
}

await loadEnvFile(".env.local");
await loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mode = process.argv.includes("--all") ? "all" : "sample";

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function sampleAlbum(album) {
  if (mode === "all") return album;

  const photos = (album.photos ?? []).slice(0, 3);
  return {
    ...album,
    photos,
    count: photos.length,
  };
}

function sampleFilm(film) {
  if (mode === "all") return film;

  return {
    ...film,
    stills: (film.stills ?? []).slice(0, 2),
  };
}

async function seedFolder(collection, folder, transform = (value) => value) {
  const files = (await fs.readdir(folder)).filter((file) => file.endsWith(".json")).sort();

  for (const [index, file] of files.entries()) {
    const raw = await readJson(path.join(folder, file));
    const data = transform(raw);
    const slug = data.id ?? path.basename(file, ".json");

    const { error } = await supabase.from("content_entries").upsert(
      {
        collection,
        slug,
        sort_order: index,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "collection,slug" },
    );

    if (error) throw error;
    console.log(`Seeded ${collection}/${slug}${mode === "sample" ? " (sample)" : ""}`);
  }
}

console.log(`Seeding Supabase content in ${mode} mode.`);
console.log("Use `bun run seed:supabase:all` to seed full galleries.\n");

await seedFolder("albums", "content/albums", sampleAlbum);
await seedFolder("films", "content/films", sampleFilm);
await seedFolder("journal", "content/journal");

const about = await readJson("content/about.json");
const { error } = await supabase.from("content_entries").upsert(
  {
    collection: "settings",
    slug: "about",
    sort_order: 0,
    data: about,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "collection,slug" },
);

if (error) throw error;
console.log("Seeded settings/about");
