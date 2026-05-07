import type { Metadata } from "next";
import PortfolioShell from "../portfolio-client";
import { About } from "../portfolio-views";
import { getPortfolioContent } from "../portfolio-content";

export const revalidate = 60;
export const metadata: Metadata = { title: "Despre · Andrei Bândilă", description: "Fotografie, film și teologie ca forme ale privirii atente.", alternates: { canonical: "/despre" }, openGraph: { title: "Despre · Andrei Bândilă", description: "Fotografie, film și teologie ca forme ale privirii atente.", url: "/despre" } };

export default async function AboutPage() {
  const content = await getPortfolioContent();
  return <PortfolioShell page="about"><About content={content} /></PortfolioShell>;
}
