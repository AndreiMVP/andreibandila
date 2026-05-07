import type { Metadata } from "next";
import AdminClient from "../admin-client";

export const metadata: Metadata = { title: "Despre · Admin" };

export default function DespreAdminPage() {
  return <AdminClient initialTab="about" />;
}
