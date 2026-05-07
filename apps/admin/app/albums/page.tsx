import type { Metadata } from "next";
import AdminClient from "../admin-client";

export const metadata: Metadata = { title: "Albume · Admin" };

export default function AlbumsAdminPage() {
  return <AdminClient initialTab="albums" />;
}
