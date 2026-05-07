"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RoutePage } from "./portfolio-client";

type NavLink = {
  id: "home" | "albums" | "films" | "journal" | "about";
  label: string;
  href: string;
};

const links: NavLink[] = [
  { id: "home", label: "Acasă", href: "/" },
  { id: "albums", label: "Foto", href: "/foto" },
  { id: "films", label: "Film", href: "/film" },
  { id: "journal", label: "Jurnal", href: "/jurnal" },
  { id: "about", label: "Despre", href: "/despre" },
];

function classNames(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(page: RoutePage, id: string) {
  if (id === "albums") return page === "albums" || page === "album";
  if (id === "films") return page === "films" || page === "film";
  if (id === "journal") return page === "journal";
  return page === id;
}

export default function HeaderClient({ page }: { page: RoutePage }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hiddenRef = useRef(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [page]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const canAutoHide = (page === "home" || page === "album") && !menuOpen;
    let frame = 0;
    let lastY = window.scrollY;

    const updateHidden = (nextHidden: boolean) => {
      if (hiddenRef.current === nextHidden) return;
      hiddenRef.current = nextHidden;
      setHidden(nextHidden);
    };

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const scrollingDown = y > lastY + 4;
      const scrollingUp = y < lastY - 4;

      setScrolled((current) => {
        const nextScrolled = y > 24;
        return current === nextScrolled ? current : nextScrolled;
      });

      if (!canAutoHide) updateHidden(false);
      else if (y <= 160 || scrollingUp) updateHidden(false);
      else if (scrollingDown) updateHidden(true);

      lastY = y;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [page, menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const closeMenuAfterNavigationStarts = () => window.requestAnimationFrame(closeMenu);
  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <header className={classNames("site-header", scrolled && "is-scrolled", hidden && "is-hidden", menuOpen && "is-menu-open")}>
      <Link href="/" className="brand" onClick={closeMenu}><span className="brand-name">Andrei Bândilă</span><span className="brand-role">Fotografie × Film</span></Link>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={toggleMenu}
      >
        <span className="nav-toggle-text">{menuOpen ? "Închide" : "Meniu"}</span>
        <span className="nav-toggle-icon" aria-hidden="true"><span /></span>
      </button>
      <nav id="site-navigation" className="site-nav" aria-label="Navigație principală">
        {links.map((link) => {
          const active = isActive(page, link.id);
          return (
            <Link
              key={link.id}
              href={link.href}
              onClick={active ? closeMenu : undefined}
              onNavigate={closeMenuAfterNavigationStarts}
              aria-current={active ? "page" : undefined}
              className={classNames("nav-link", active && "is-active")}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
