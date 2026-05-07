import Link from "next/link";
import PortfolioShell from "./portfolio-client";

export default function NotFound() {
  return (
    <PortfolioShell page="home">
      <main className="page fade-in">
        <section className="page-header">
          <div className="page-eyebrow">404</div>
          <h1 className="page-title">Pagina nu a fost găsită</h1>
          <p className="page-lede">Conținutul căutat nu există sau nu este publicat.</p>
          <Link href="/" className="link-arrow">Înapoi acasă →</Link>
        </section>
      </main>
    </PortfolioShell>
  );
}
