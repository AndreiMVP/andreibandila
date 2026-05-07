import type { Metadata } from "next";
import PortfolioShell from "../portfolio-client";
import { Journal } from "../portfolio-views";
import { getPortfolioContent } from "../portfolio-content";

export const revalidate = 60;
export const metadata: Metadata = { title: "Jurnal · Andrei Bândilă", description: "Texte despre fotografie, scenaristică și teologie.", alternates: { canonical: "/jurnal" }, openGraph: { title: "Jurnal · Andrei Bândilă", description: "Texte despre fotografie, scenaristică și teologie.", url: "/jurnal" } };

export default async function JournalPage() {
  const content = await getPortfolioContent();
  return <PortfolioShell page="journal"><Journal journal={content.journal} /></PortfolioShell>;
}
