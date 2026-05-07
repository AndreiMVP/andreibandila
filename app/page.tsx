import type { Metadata } from "next";
import PortfolioShell from "./portfolio-client";
import { Home as HomeView } from "./portfolio-views";
import { getPortfolioContent } from "./portfolio-content";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Andrei Bândilă · Fotografie",
  description: "Portofoliu de fotografie, film și jurnal editorial.",
  alternates: { canonical: "/" },
  openGraph: { title: "Andrei Bândilă · Fotografie", description: "Portofoliu de fotografie, film și jurnal editorial.", type: "website", url: "/" },
};

export default async function Home() {
  const content = await getPortfolioContent();

  return <PortfolioShell page="home"><HomeView content={content} /></PortfolioShell>;
}
