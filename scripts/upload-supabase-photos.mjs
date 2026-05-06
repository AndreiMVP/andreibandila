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

const samplePaths = new Set([
  "/photos/01.jpg",
  "/photos/02.jpg",
  "/photos/03.jpg",
  "/photos/04.jpg",
  "/photos/05.jpg",
  "/photos/09.jpg",
  "/photos/hero-01.jpg",
  "/photos/hero-02.jpg",
  "/photos/hero-03.jpg",
  "/photos/film-galaction-poster.jpg",
]);

function shouldUpload(publicPath) {
  return mode === "all" || samplePaths.has(publicPath);
}

function isLocalPhotoUrl(value) {
  return typeof value === "string" && value.startsWith("/photos/");
}

function toStoragePath(publicPath) {
  return publicPath.replace(/^\/photos\//, "seed/");
}

function toFilePath(publicPath) {
  return path.join("public", publicPath.replace(/^\//, ""));
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

async function uploadPublicPhoto(publicPath) {
  const storagePath = toStoragePath(publicPath);
  const filePath = toFilePath(publicPath);
  const buffer = await fs.readFile(filePath);

  const { error } = await supabase.storage.from("photos").upload(storagePath, buffer, {
    contentType: contentTypeFor(filePath),
    cacheControl: "31536000",
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("photos").getPublicUrl(storagePath);
  console.log(`Uploaded ${publicPath} -> ${data.publicUrl}`);
  return data.publicUrl;
}

async function rewriteImages(value, urlMap) {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => rewriteImages(item, urlMap)));
  }

  if (!value || typeof value !== "object") {
    if (isLocalPhotoUrl(value) && shouldUpload(value)) {
      if (!urlMap.has(value)) urlMap.set(value, await uploadPublicPhoto(value));
      return urlMap.get(value);
    }
    return value;
  }

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = await rewriteImages(child, urlMap);
  }
  return next;
}

const { data: entries, error } = await supabase
  .from("content_entries")
  .select("id, collection, slug, data")
  .order("collection")
  .order("sort_order", { ascending: true });

if (error) throw error;
if (!entries?.length) {
  console.log("No content_entries found. Run `bun run seed:supabase` first.");
  process.exit(0);
}

console.log(`Uploading ${mode === "all" ? "all local photos" : "sample local photos"} referenced by Supabase content.\n`);

const urlMap = new Map();

for (const entry of entries) {
  const rewritten = await rewriteImages(entry.data, urlMap);
  const { error: updateError } = await supabase
    .from("content_entries")
    .update({ data: rewritten, updated_at: new Date().toISOString() })
    .eq("id", entry.id);

  if (updateError) throw updateError;
  console.log(`Updated ${entry.collection}/${entry.slug}`);
}

console.log(`\nDone. Uploaded ${urlMap.size} unique image(s).`);
