import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PortfolioShell from "../../portfolio-client";
import { FilmDetail } from "../../portfolio-views";
import { getFilmById, getPublishedFilmIds } from "../../portfolio-content";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return await getPublishedFilmIds();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const film = await getFilmById(id);
  return {
    title: film ? `${film.title} · Andrei Bândilă` : "Film · Andrei Bândilă",
    description: film?.description,
    alternates: { canonical: `/film/${id}` },
    openGraph: { title: film?.title, description: film?.description, url: `/film/${id}`, type: "video.movie", images: film?.cover ? [film.cover] : undefined },
  };
}

export default async function FilmPage({ params }: Props) {
  const { id } = await params;
  const film = await getFilmById(id);
  if (!film) notFound();
  return <PortfolioShell page="film"><FilmDetail film={film} /></PortfolioShell>;
}
