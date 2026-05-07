import type { Metadata } from "next";
import AdminClient from "../../admin-client";

export const metadata: Metadata = { title: "Album · Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function AlbumAdminPage({ params }: Props) {
  const { id } = await params;
  return <AdminClient initialTab="albums" initialItemId={id} />;
}
