import type { Metadata } from "next";
import AdminClient from "../admin-client";

export const metadata: Metadata = { title: "Jurnal · Admin" };

export default function JournalAdminPage() {
  return <AdminClient initialTab="journal" />;
}
