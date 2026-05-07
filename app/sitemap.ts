import type { MetadataRoute } from "next";
import { getSiteUrl } from "@andreibandila/shared";
import { getPortfolioContent } from "./portfolio-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const content = await getPortfolioContent();
  return [
    "",
    "/foto",
    "/film",
    "/despre",
    "/jurnal",
    ...content.albums.map((item) => `/foto/${item.id}`),
    ...content.films.map((item) => `/film/${item.id}`),
    ...content.journal.map((item) => `/jurnal/${item.id}`),
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 }));
}
