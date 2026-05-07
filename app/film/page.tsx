import type { Metadata } from "next";
import PortfolioShell from "../portfolio-client";
import { FilmsList } from "../portfolio-views";
import { getPortfolioContent } from "../portfolio-content";

export const revalidate = 60;
export const metadata: Metadata = { title: "Film · Andrei Bândilă", description: "Proiecte cinematografice.", alternates: { canonical: "/film" }, openGraph: { title: "Film · Andrei Bândilă", description: "Proiecte cinematografice.", url: "/film" } };

export default async function FilmsPage() {
  const content = await getPortfolioContent();
  return <PortfolioShell page="films"><FilmsList films={content.films} /></PortfolioShell>;
}
