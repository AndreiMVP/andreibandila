import { createClient } from "@supabase/supabase-js";
import { ABOUT_TEXT, ALBUMS, FILMS, JOURNAL } from "./portfolio-data";
import type { Album, Film, JournalEntry } from "./portfolio-data";

export type PortfolioContent = {
  albums: Album[];
  films: Film[];
  journal: JournalEntry[];
  aboutText: string[];
};

type ContentEntry = {
  collection: "albums" | "films" | "journal" | "settings";
  slug: string;
  data: unknown;
};

export const fallbackContent: PortfolioContent = {
  albums: [...ALBUMS],
  films: [...FILMS],
  journal: [...JOURNAL],
  aboutText: [...ABOUT_TEXT],
};

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { fetch },
  });
}

export async function getPortfolioContent(): Promise<PortfolioContent> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return fallbackContent;

  const { data, error } = await supabase
    .from("content_entries")
    .select("collection, slug, data")
    .order("sort_order", { ascending: true })
    .returns<ContentEntry[]>();

  if (error || !data?.length) return fallbackContent;

  const settings = data.find((entry) => entry.collection === "settings" && entry.slug === "about");

  return {
    albums: data
      .filter((entry) => entry.collection === "albums")
      .map((entry) => entry.data as Album),
    films: data
      .filter((entry) => entry.collection === "films")
      .map((entry) => entry.data as Film),
    journal: data
      .filter((entry) => entry.collection === "journal")
      .map((entry) => entry.data as JournalEntry),
    aboutText: (settings?.data as { paragraphs?: string[] } | undefined)?.paragraphs ?? fallbackContent.aboutText,
  };
}
