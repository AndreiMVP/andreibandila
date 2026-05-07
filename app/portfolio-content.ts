import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { SITE_CONFIG } from "@andreibandila/shared";
import type { AboutSection, Album, Database, Film, JournalEntry, Photo, PortfolioContent } from "@andreibandila/shared";

export type { PortfolioContent } from "@andreibandila/shared";

const HARDCODED_CONTACT = {
  contactEmail: SITE_CONFIG.email,
  contactLocation: SITE_CONFIG.location,
  socialLinks: [...SITE_CONFIG.socialLinks],
};

export const emptyPortfolioContent: PortfolioContent = {
  albums: [],
  films: [],
  journal: [],
  aboutText: [],
  aboutSections: [],
  ...HARDCODED_CONTACT,
};

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient<Database>(url, anonKey, { auth: { persistSession: false }, global: { fetch } });
}

function textToParagraphs(text: string) {
  return text
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

type AlbumPhotoRow = Photo & { is_cover: boolean; sort_order: number; blur_data_url?: string | null };
type AlbumRow = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  location: string;
  description: string;
  published: boolean;
  album_photos?: AlbumPhotoRow[];
};
type FilmRow = { id: string; title: string; subtitle: string; year: string; role: string; description: string; cover: string; published: boolean };
type JournalRow = { id: string; title: string; content: string; image: string; published: boolean };
type AboutRow = { portrait_image: string; content: string };
type AboutSectionRow = { id: string; title: string; body: string; sort_order: number };

const ALBUM_SELECT = "id,title,subtitle,year,location,description,published,sort_order,album_photos(src,caption,width,height,blur_data_url,is_cover,sort_order)";
const FILM_SELECT = "id,title,subtitle,year,role,description,cover,published,sort_order";
const JOURNAL_SELECT = "id,title,content,image,published,sort_order";

function mapAlbum(row: AlbumRow): Album {
  const photos = (row.album_photos ?? []).map(({ src, caption, width, height, blur_data_url }) => ({ src, caption, width, height, blurDataURL: blur_data_url }));
  const coverPhoto = (row.album_photos ?? []).find((photo) => photo.is_cover) ?? row.album_photos?.[0];
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    year: row.year,
    location: row.location,
    cover: coverPhoto?.src ?? "",
    count: photos.length,
    description: row.description,
    photos,
  };
}

function mapFilm(row: FilmRow): Film {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    year: row.year,
    role: row.role,
    description: row.description,
    cover: row.cover,
  };
}

function mapJournal(row: JournalRow): JournalEntry {
  const body = textToParagraphs(row.content);
  return { id: row.id, title: row.title, excerpt: body[0] ?? "", body, image: row.image };
}

export const getPortfolioContent = cache(async (): Promise<PortfolioContent> => {
  const supabase = getSupabaseServerClient();
  if (!supabase) return emptyPortfolioContent;

  try {
    const [albumsRes, filmsRes, journalRes, aboutRes, aboutSectionsRes] = await Promise.all([
      supabase
        .from("albums")
        .select(ALBUM_SELECT)
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("sort_order", { referencedTable: "album_photos", ascending: true }),
      supabase.from("films").select(FILM_SELECT).eq("published", true).order("sort_order", { ascending: true }),
      supabase.from("journal_entries").select(JOURNAL_SELECT).eq("published", true).order("sort_order", { ascending: true }),
      supabase.from("about_page").select("portrait_image,content").eq("id", true).maybeSingle(),
      supabase.from("about_sections").select("id,title,body,sort_order").order("sort_order", { ascending: true }),
    ]);

    const firstError = albumsRes.error || filmsRes.error || journalRes.error || aboutRes.error || aboutSectionsRes.error;
    if (firstError) {
      console.error("[portfolio-content] supabase query failed", firstError);
      return emptyPortfolioContent;
    }

    const albums = ((albumsRes.data ?? []) as AlbumRow[]).map(mapAlbum);
    const films = ((filmsRes.data ?? []) as FilmRow[]).map(mapFilm);
    const journal = ((journalRes.data ?? []) as JournalRow[]).map(mapJournal);
    const about = aboutRes.data as AboutRow | null;
    const aboutSections = ((aboutSectionsRes.data ?? []) as AboutSectionRow[]).map(({ id, title, body }) => ({ id, title, body })) satisfies AboutSection[];

    return {
      albums,
      films,
      journal,
      aboutText: about?.content ? textToParagraphs(about.content) : [],
      aboutImage: about?.portrait_image || undefined,
      aboutSections,
      ...HARDCODED_CONTACT,
    };
  } catch (error) {
    console.error("[portfolio-content] unexpected failure", error);
    return emptyPortfolioContent;
  }
});

export const getAlbumById = cache(async (id: string): Promise<Album | null> => {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const res = await supabase
      .from("albums")
      .select(ALBUM_SELECT)
      .eq("id", id)
      .eq("published", true)
      .order("sort_order", { referencedTable: "album_photos", ascending: true })
      .maybeSingle();
    if (res.error) {
      console.error("[portfolio-content] getAlbumById failed", res.error);
      return null;
    }
    return res.data ? mapAlbum(res.data as AlbumRow) : null;
  } catch (error) {
    console.error("[portfolio-content] getAlbumById threw", error);
    return null;
  }
});

export const getFilmById = cache(async (id: string): Promise<Film | null> => {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const res = await supabase.from("films").select(FILM_SELECT).eq("id", id).eq("published", true).maybeSingle();
    if (res.error) {
      console.error("[portfolio-content] getFilmById failed", res.error);
      return null;
    }
    return res.data ? mapFilm(res.data as FilmRow) : null;
  } catch (error) {
    console.error("[portfolio-content] getFilmById threw", error);
    return null;
  }
});

export const getJournalEntryById = cache(async (id: string): Promise<JournalEntry | null> => {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const res = await supabase.from("journal_entries").select(JOURNAL_SELECT).eq("id", id).eq("published", true).maybeSingle();
    if (res.error) {
      console.error("[portfolio-content] getJournalEntryById failed", res.error);
      return null;
    }
    return res.data ? mapJournal(res.data as JournalRow) : null;
  } catch (error) {
    console.error("[portfolio-content] getJournalEntryById threw", error);
    return null;
  }
});

async function fetchPublishedIds(table: "albums" | "films" | "journal_entries"): Promise<{ id: string }[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  try {
    const res = await supabase.from(table).select("id").eq("published", true).order("sort_order", { ascending: true });
    if (res.error) {
      console.error(`[portfolio-content] fetchPublishedIds(${table}) failed`, res.error);
      return [];
    }
    return (res.data ?? []) as { id: string }[];
  } catch (error) {
    console.error(`[portfolio-content] fetchPublishedIds(${table}) threw`, error);
    return [];
  }
}

export const getPublishedAlbumIds = cache(() => fetchPublishedIds("albums"));
export const getPublishedFilmIds = cache(() => fetchPublishedIds("films"));
export const getPublishedJournalIds = cache(() => fetchPublishedIds("journal_entries"));
