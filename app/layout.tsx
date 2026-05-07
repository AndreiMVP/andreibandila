import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { getSiteUrl, SITE_CONFIG } from "@andreibandila/shared";
import "./globals.scss";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_CONFIG.name,
  title: { default: "Andrei Bândilă · Fotografie", template: "%s" },
  description: "Portofoliu de fotografie, film și jurnal editorial.",
  alternates: { canonical: "/" },
  icons: { icon: [{ url: "/icon.svg?v=2", type: "image/svg+xml" }, { url: "/favicon.ico?v=2" }] },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "Andrei Bândilă",
    title: "Andrei Bândilă · Fotografie",
    description: "Portofoliu de fotografie, film și jurnal editorial.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Andrei Bândilă · Fotografie",
    description: "Portofoliu de fotografie, film și jurnal editorial.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" data-theme="dark" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: SITE_CONFIG.name,
              url: getSiteUrl(),
              jobTitle: ["Fotograf", "Scenarist", "Teolog"],
              email: SITE_CONFIG.email,
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
