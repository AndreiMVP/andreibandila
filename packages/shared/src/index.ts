export { LANDING_HERO_IMAGES, SITE_CONFIG, getSiteUrl } from "./site-config";
export type { Database } from "./database.types";

export type Photo = {
  src: string;
  caption: string;
  width?: number | null;
  height?: number | null;
  blurDataURL?: string | null;
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
  role: string;
  description: string;
  cover: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  excerpt: string;
  body: string[];
  image?: string;
};

export type AboutSection = {
  id: string;
  title: string;
  body: string;
};

export type AboutSocialLink = { label: string; href: string };

export type PortfolioContent = {
  albums: Album[];
  films: Film[];
  journal: JournalEntry[];
  aboutText: string[];
  aboutImage?: string;
  aboutSections: AboutSection[];
  contactEmail: string;
  contactLocation: string;
  socialLinks: AboutSocialLink[];
};

export type AdminAlbum = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  location: string;
  description: string;
  published: boolean;
  sort_order: number;
};

export type AdminAlbumPhoto = {
  id: string;
  album_id: string;
  src: string;
  caption: string;
  is_cover: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
};

export type AdminFilm = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  description: string;
  cover: string;
  published: boolean;
  sort_order: number;
};

export type AdminJournalEntry = {
  id: string;
  title: string;
  content: string;
  image: string;
  published: boolean;
  sort_order: number;
};

export type AdminAboutPage = {
  portrait_image: string;
  content: string;
};

export type AdminAboutSection = {
  id: string;
  title: string;
  body: string;
  sort_order: number;
};
