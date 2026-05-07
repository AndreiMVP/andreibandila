import type { Metadata } from "next";
import AdminClient from "../admin-client";

export const metadata: Metadata = { title: "Login · Admin" };

export default function LoginPage() {
  return <AdminClient loginPage />;
}
