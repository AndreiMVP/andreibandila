import type { Metadata } from "next";
import AdminClient from "../admin-client";

export const metadata: Metadata = { title: "Filme · Admin" };

export default function FilmsAdminPage() {
  return <AdminClient initialTab="films" />;
}
