import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PortfolioShell from "../../portfolio-client";
import { AlbumDetail } from "../../portfolio-views";
import { getAlbumById, getPublishedAlbumIds } from "../../portfolio-content";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return await getPublishedAlbumIds();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getAlbumById(id);
  return {
    title: album ? `${album.title} · Andrei Bândilă` : "Foto · Andrei Bândilă",
    description: album?.description,
    alternates: { canonical: `/foto/${id}` },
    openGraph: { title: album?.title, description: album?.description, url: `/foto/${id}`, type: "article", images: album?.cover ? [album.cover] : undefined },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params;
  const album = await getAlbumById(id);
  if (!album) notFound();
  return <PortfolioShell page="album"><AlbumDetail album={album} /></PortfolioShell>;
}
