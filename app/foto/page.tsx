import type { Metadata } from "next";
import PortfolioShell from "../portfolio-client";
import { AlbumsList } from "../portfolio-views";
import { getPortfolioContent } from "../portfolio-content";

export const revalidate = 60;
export const metadata: Metadata = { title: "Foto · Andrei Bândilă", description: "Serii de fotografie documentară.", alternates: { canonical: "/foto" }, openGraph: { title: "Foto · Andrei Bândilă", description: "Serii de fotografie documentară.", url: "/foto" } };

export default async function AlbumsPage() {
  const content = await getPortfolioContent();
  return <PortfolioShell page="albums"><AlbumsList albums={content.albums} density="comfortable" /></PortfolioShell>;
}
