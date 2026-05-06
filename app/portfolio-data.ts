import about from "../content/about.json";
import saracinesti from "../content/albums/saracinesti.json";
import seara from "../content/albums/seara.json";
import timisoara from "../content/albums/timisoara.json";
import liviuGalaction from "../content/films/liviu-galaction.json";
import luminaNecreata from "../content/films/lumina-necreata.json";
import pendulul from "../content/films/pendulul.json";
import subFereastra from "../content/films/sub-fereastra.json";
import ceVadCandCitescIcoane from "../content/journal/ce-vad-cand-citesc-icoane.json";
import fereastraStagePub from "../content/journal/fereastra-stage-pub.json";
import luminaCareAsteapta from "../content/journal/lumina-care-asteapta.json";
import saracinestiRozeta from "../content/journal/saracinesti-rozeta.json";
import scenariuVsCadru from "../content/journal/scenariu-vs-cadru.json";

export type Photo = {
  src: string;
  caption: string;
};

export type Album = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  location: string;
  cover: string;
  count: number;
  description: string;
  photos: Photo[];
};

export type Film = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  duration: string;
  role: string;
  status: string;
  cover: string;
  poster?: string;
  festivals: string[];
  synopsis: string;
  stills: Photo[];
};

export type JournalEntry = {
  id: string;
  kind: "eseu" | "notă" | string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  body: string[];
};

export type Route =
  | { page: "home" }
  | { page: "albums" }
  | { page: "album"; id: string }
  | { page: "films" }
  | { page: "film"; id: string }
  | { page: "about" }
  | { page: "journal" }
  | { page: "article"; id: string };

export const ALBUMS = [timisoara, saracinesti, seara] satisfies Album[];

export const FILMS = [
  pendulul,
  subFereastra,
  luminaNecreata,
  liviuGalaction,
] satisfies Film[];

export const JOURNAL = [
  luminaCareAsteapta,
  scenariuVsCadru,
  saracinestiRozeta,
  fereastraStagePub,
  ceVadCandCitescIcoane,
] satisfies JournalEntry[];

export const ABOUT_TEXT = about.paragraphs satisfies string[];
