import { z } from "zod";
import type {
  AdminAboutPage as About,
  AdminAlbum as Album,
  AdminFilm as Film,
  AdminJournalEntry as Journal,
} from "@andreibandila/shared";
import type { Tab } from "./admin-components";

export const emptyAlbum: Album = {
  id: "",
  title: "",
  subtitle: "",
  year: "",
  location: "",
  description: "",
  published: false,
  sort_order: 0,
};

export const emptyFilm: Film = {
  id: "",
  title: "",
  subtitle: "",
  year: "",
  role: "",
  description: "",
  cover: "",
  published: false,
  sort_order: 0,
};

export const emptyJournal: Journal = {
  id: "",
  title: "",
  content: "",
  image: "",
  published: false,
  sort_order: 0,
};

export const emptyAbout: About = { portrait_image: "", content: "" };

const requiredString = z.string().trim().min(1, "Completează câmpurile obligatorii.");
const slugString = requiredString.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slugul poate conține doar litere mici, cifre și cratime.");

export const albumSchema = z.object({
  id: slugString,
  title: requiredString,
  subtitle: z.string(),
  year: z.string(),
  location: z.string(),
  description: z.string(),
  published: z.boolean(),
  sort_order: z.number(),
});

export const filmSchema = z.object({
  id: slugString,
  title: requiredString,
  subtitle: z.string(),
  year: z.string(),
  role: z.string(),
  description: z.string(),
  cover: z.string(),
  published: z.boolean(),
  sort_order: z.number(),
});

export const journalSchema = z.object({
  id: slugString,
  title: requiredString,
  content: z.string(),
  image: z.string(),
  published: z.boolean(),
  sort_order: z.number(),
});

export const aboutSchema = z.object({ portrait_image: z.string(), content: z.string() });
export const aboutSectionSchema = z.object({ id: requiredString, title: requiredString, body: z.string(), sort_order: z.number() });

export function validationMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Date invalide.";
  return error instanceof Error ? error.message : "A apărut o eroare.";
}

export function stable(value: unknown) {
  return JSON.stringify(value);
}

export function tabFromPath(pathname: string): Tab {
  if (pathname.startsWith("/films")) return "films";
  if (pathname.startsWith("/journal")) return "journal";
  if (pathname.startsWith("/despre") || pathname.startsWith("/about")) return "about";
  return "albums";
}

export function pathForTab(tab: Tab, id?: string) {
  const base = tab === "albums" ? "/albums" : tab === "films" ? "/films" : tab === "journal" ? "/journal" : "/despre";
  return id && tab !== "about" ? `${base}/${id}` : base;
}

export function itemIdFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length > 1 ? parts[1] : undefined;
}

export function storagePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/photos/";
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

export function storagePathForFile(file: File, folder: string) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

export type ImageMetadata = { width: number | null; height: number | null; blur_data_url: string | null };

export async function readImageMetadata(file: File): Promise<ImageMetadata> {
  try {
    const bitmap = await createImageBitmap(file);
    const metadata = imageMetadataFromDrawable(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    return metadata;
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      return imageMetadataFromDrawable(image, image.naturalWidth, image.naturalHeight);
    } catch {
      return { width: null, height: null, blur_data_url: null };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function imageMetadataFromDrawable(drawable: CanvasImageSource, width: number, height: number): ImageMetadata {
  const max = 24;
  const ratio = width / height;
  const canvas = document.createElement("canvas");
  canvas.width = ratio >= 1 ? max : Math.max(1, Math.round(max * ratio));
  canvas.height = ratio >= 1 ? Math.max(1, Math.round(max / ratio)) : max;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(drawable, 0, 0, canvas.width, canvas.height);
  return { width, height, blur_data_url: canvas.toDataURL("image/jpeg", 0.55) };
}
