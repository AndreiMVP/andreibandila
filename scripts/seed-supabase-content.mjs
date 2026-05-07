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
      process.env[key] ??= valueParts.join("=").replace(/^['\"]|['\"]$/g, "");
    }
  } catch {}
}
await loadEnvFile(".env.local");
await loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mode = process.argv.includes("--all") ? "all" : "sample";
if (!url || !serviceRoleKey) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false }, realtime: { transport: ws } });
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return {};
}

async function localImageSize(src) {
  if (typeof src !== "string" || !src.startsWith("/photos/")) return {};
  try {
    const buffer = await fs.readFile(path.join("public", src.replace(/^\//, "")));
    if (buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) return jpegSize(buffer);
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
      if (buffer.toString("ascii", 12, 16) === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    }
  } catch {}
  return {};
}

async function seedAlbums() {
  const files = (await fs.readdir("content/albums")).filter((f) => f.endsWith(".json")).sort();
  for (const [index, file] of files.entries()) {
    const album = await readJson(path.join("content/albums", file));
    const photos = mode === "all" ? album.photos ?? [] : (album.photos ?? []).slice(0, 3);
    const { error } = await supabase.from("albums").upsert({ id: album.id, title: album.title, subtitle: album.subtitle, year: album.year, location: album.location, description: album.description, sort_order: index, updated_at: new Date().toISOString() });
    if (error) throw error;
    await supabase.from("album_photos").delete().eq("album_id", album.id);
    if (photos.length) {
      const rows = await Promise.all(photos.map(async (photo, i) => ({ album_id: album.id, src: photo.src, caption: photo.caption, is_cover: photo.src === album.cover || i === 0, sort_order: i, ...(await localImageSize(photo.src)) })));
      const { error: photosError } = await supabase.from("album_photos").insert(rows);
      if (photosError) throw photosError;
    }
    console.log(`Seeded album/${album.id}`);
  }
}

async function seedFilms() {
  const files = (await fs.readdir("content/films")).filter((f) => f.endsWith(".json")).sort();
  for (const [index, file] of files.entries()) {
    const film = await readJson(path.join("content/films", file));
    const { error } = await supabase.from("films").upsert({ id: film.id, title: film.title, subtitle: film.subtitle, year: film.year, role: film.role, description: film.synopsis, cover: film.cover, sort_order: index, updated_at: new Date().toISOString() });
    if (error) throw error;
    console.log(`Seeded film/${film.id}`);
  }
}

async function seedJournal() {
  const files = (await fs.readdir("content/journal")).filter((f) => f.endsWith(".json")).sort();
  for (const [index, file] of files.entries()) {
    const entry = await readJson(path.join("content/journal", file));
    const { error } = await supabase.from("journal_entries").upsert({ id: entry.id, title: entry.title, content: (entry.body ?? []).join("\n\n"), image: "", sort_order: index, updated_at: new Date().toISOString() });
    if (error) throw error;
    console.log(`Seeded journal/${entry.id}`);
  }
}

async function seedAbout() {
  const about = await readJson("content/about.json");
  const { error } = await supabase.from("about_page").upsert({ id: true, portrait_image: "", content: (about.paragraphs ?? []).join("\n\n"), updated_at: new Date().toISOString() });
  if (error) throw error;
  console.log("Seeded about");
}

console.log(`Seeding new CMS tables in ${mode} mode.\n`);
await seedAlbums();
await seedFilms();
await seedJournal();
await seedAbout();
