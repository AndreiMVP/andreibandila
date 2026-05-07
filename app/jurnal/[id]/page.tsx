import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PortfolioShell from "../../portfolio-client";
import { Article } from "../../portfolio-views";
import { getJournalEntryById, getPublishedJournalIds } from "../../portfolio-content";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return await getPublishedJournalIds();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getJournalEntryById(id);
  return {
    title: article ? `${article.title} · Andrei Bândilă` : "Jurnal · Andrei Bândilă",
    description: article?.excerpt,
    alternates: { canonical: `/jurnal/${id}` },
    openGraph: { title: article?.title, description: article?.excerpt, url: `/jurnal/${id}`, type: "article", images: article?.image ? [article.image] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getJournalEntryById(id);
  if (!article) notFound();
  return <PortfolioShell page="article"><Article article={article} /></PortfolioShell>;
}
