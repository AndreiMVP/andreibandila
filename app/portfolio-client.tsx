import { SITE_CONFIG } from "@andreibandila/shared";
import HeaderClient from "./header-client";
import PageFrame from "./page-frame";

export type RoutePage = "home" | "albums" | "album" | "films" | "film" | "about" | "journal" | "article";

function Footer() {
  const { name, email, location, socialLinks } = SITE_CONFIG;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-grid footer-grid-quiet">
        <div className="footer-identity">
          <div className="footer-name">{name}</div>
          <p className="footer-vocation">Fotografie, scenaristică și teologie — o practică a privirii atente.</p>
        </div>
        {(email || location) && <div><div className="footer-label">Contact</div>{email && <a href={`mailto:${email}`} className="footer-link">{email}</a>}{location && <div className="footer-meta">{location}</div>}</div>}
        {socialLinks.length > 0 && <div><div className="footer-label">Canale</div>{socialLinks.map((link) => <a key={link.label} href={link.href} className="footer-link">{link.label}</a>)}</div>}
        <div className="footer-colophon"><div className="footer-meta">© 2024–{year}</div><div className="footer-meta">Toate imaginile sunt protejate prin copyright.</div></div>
      </div>
    </footer>
  );
}

export default function PortfolioShell({ page, children }: { page: RoutePage; children: React.ReactNode }) {
  return (
    <div className="site" data-route={page}>
      <HeaderClient page={page} />
      <PageFrame>{children}</PageFrame>
      <Footer />
    </div>
  );
}
