import type { Metadata } from "next";
import AdminClient from "../../admin-client";

export const metadata: Metadata = { title: "Film · Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function FilmAdminPage({ params }: Props) {
  const { id } = await params;
  return <AdminClient initialTab="films" initialItemId={id} />;
}
