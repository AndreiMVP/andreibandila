"use client";

import { useEffect } from "react";
import Link from "next/link";
import PortfolioShell from "./portfolio-client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <PortfolioShell page="home">
      <main className="page fade-in">
        <section className="page-header">
          <div className="page-eyebrow">Eroare</div>
          <h1 className="page-title">Ceva nu a mers</h1>
          <p className="page-lede">A apărut o eroare neașteptată la încărcarea paginii. Poți încerca din nou sau te poți întoarce acasă.</p>
          <div className="page-actions">
            <button type="button" onClick={reset} className="link-arrow">Reîncearcă</button>
            <Link href="/" className="link-arrow">Înapoi acasă →</Link>
          </div>
        </section>
      </main>
    </PortfolioShell>
  );
}
