import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminAboutPage as About,
  AdminAboutSection as AboutSection,
  AdminAlbum as Album,
  AdminFilm as Film,
  AdminJournalEntry as Journal,
} from "@andreibandila/shared";

export type AdminData = {
  albums: Album[];
  films: Film[];
  journalEntries: Journal[];
  about: About | null;
  aboutSections: AboutSection[];
};

export async function fetchAdminData(supabase: SupabaseClient): Promise<AdminData> {
  const [albums, films, journalEntries, about, aboutSections] = await Promise.all([
    supabase.from("albums").select("id,title,subtitle,year,location,description,published,sort_order").order("sort_order"),
    supabase.from("films").select("id,title,subtitle,year,role,description,cover,published,sort_order").order("sort_order"),
    supabase.from("journal_entries").select("id,title,content,image,published,sort_order").order("sort_order"),
    supabase.from("about_page").select("portrait_image,content").eq("id", true).maybeSingle(),
    supabase.from("about_sections").select("id,title,body,sort_order").order("sort_order"),
  ]);

  const error = albums.error || films.error || journalEntries.error || about.error || aboutSections.error;
  if (error) throw error;

  return {
    albums: (albums.data ?? []) as Album[],
    films: (films.data ?? []) as Film[],
    journalEntries: (journalEntries.data ?? []) as Journal[],
    about: (about.data as About | null) ?? null,
    aboutSections: (aboutSections.data ?? []) as AboutSection[],
  };
}
