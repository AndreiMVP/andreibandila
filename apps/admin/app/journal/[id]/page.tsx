import type { Metadata } from "next";
import AdminClient from "../../admin-client";

export const metadata: Metadata = { title: "Articol · Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function JournalEntryAdminPage({ params }: Props) {
  const { id } = await params;
  return <AdminClient initialTab="journal" initialItemId={id} />;
}
