import AdminClient from "./admin-client";

export const metadata = {
  title: "Admin · Andrei Bândilă",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
