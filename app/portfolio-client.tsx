"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Photo, Route } from "./portfolio-data";
import type { PortfolioContent } from "./portfolio-content";


const PortfolioContentContext = createContext<PortfolioContent | null>(null);

function usePortfolioContent() {
  const content = useContext(PortfolioContentContext);
  if (!content) throw new Error("Portfolio content provider is missing");
  return content;
}

// ───────────────────────────────────────────────────────────────────────────
// ROUTING (hash-based, light)
// ───────────────────────────────────────────────────────────────────────────

function parseHash(): Route {
  const h = (window.location.hash || "#/").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts.length === 0) return { page: "home" };
  if (parts[0] === "albume") {
    return parts[1] ? { page: "album", id: parts[1] } : { page: "albums" };
  }
  if (parts[0] === "filme") {
    return parts[1] ? { page: "film", id: parts[1] } : { page: "films" };
  }
  if (parts[0] === "despre") return { page: "about" };
  if (parts[0] === "jurnal") {
    return parts[1] ? { page: "article", id: parts[1] } : { page: "journal" };
  }
  return { page: "home" };
}

// ───────────────────────────────────────────────────────────────────────────
// CHROME — Header + Footer
// ───────────────────────────────────────────────────────────────────────────

function Header({ route }: { route: Route }) {
  const links = [
    { id: "home", label: "Acasă", href: "#/" },
    { id: "albums", label: "Foto", href: "#/albume" },
    { id: "films", label: "Film", href: "#/filme" },
    { id: "journal", label: "Jurnal", href: "#/jurnal" },
    { id: "about", label: "Despre", href: "#/despre" },
  ];
  const isActive = (id: string) => {
    if (id === "albums") return route.page === "albums" || route.page === "album";
    if (id === "films") return route.page === "films" || route.page === "film";
    if (id === "journal") return route.page === "journal" || route.page === "article";
    return route.page === id;
  };
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={"site-header" + (scrolled ? " is-scrolled" : "")}>
      <a href="#/" className="brand">
        <span className="brand-name">Andrei Bândilă</span>
        <span className="brand-role">Fotografie</span>
      </a>
      <nav className="site-nav">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.href}
            className={"nav-link " + (isActive(l.id) ? "is-active" : "")}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-name">Andrei Bândilă</div>
          <div className="footer-meta">Fotografie · Scenaristică · Teologie</div>
        </div>
        <div>
          <div className="footer-label">Contact</div>
          <a href="mailto:andreiraresbandi@gmail.com" className="footer-link">andreiraresbandi@gmail.com</a>
          <div className="footer-meta">Timișoara · București</div>
        </div>
        <div>
          <div className="footer-label">Pe alte canale</div>
          <a href="#" className="footer-link">Instagram</a>
          <a href="#" className="footer-link">Vimeo</a>
          <a href="#" className="footer-link">Substack</a>
        </div>
        <div className="footer-colophon">
          <div className="footer-meta">© 2024–2026 Andrei Bândilă.</div>
          <div className="footer-meta">Toate fotografiile sunt protejate prin copyright.</div>
        </div>
      </div>
    </footer>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// HOME
// ───────────────────────────────────────────────────────────────────────────

function Home() {
  const { albums: ALBUMS, films: FILMS } = usePortfolioContent();
  const heroes = [
    { src: "/photos/hero-01.jpg", caption: "Lumânări la utrenia Învierii" },
    { src: "/photos/hero-02.jpg", caption: "Trapeza, după rugăciune" },
    { src: "/photos/hero-03.jpg", caption: "Convorbire, în cimitirul mănăstirii" },
  ];
  return (
    <main className="page page-home fade-in">
      <section className="home-fullbleed">
        {heroes.map((h, i) => (
          <figure key={i} className="home-fullbleed-photo">
            <img src={h.src} alt={h.caption} />
            <figcaption>
              <span className="cap-num">{String(i + 1).padStart(2, "0")} / {String(heroes.length).padStart(2, "0")}</span>
              <span className="cap-text">{h.caption}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="home-statement">
        <p className="home-statement-text">
          Andrei Bândilă fotografiază în alb-negru, lent, cu reverență pentru
          ce se arată singur — orașe noctambule, mănăstiri, oameni care așteaptă.
        </p>
        <a href="#/despre" className="portrait-link">Despre fotograf →</a>
      </section>

      <section className="featured-albums">
        <div className="section-head">
          <div className="section-eyebrow">Albume</div>
          <h2 className="section-title">Trei serii de drum</h2>
        </div>
        <div className="featured-grid">
          {ALBUMS.map((a) => (
            <a key={a.id} href={`#/albume/${a.id}`} className="featured-card">
              <div className="featured-cover">
                <img src={a.cover} alt={a.title} />
              </div>
              <div className="featured-meta">
                <div className="featured-title">{a.title}</div>
                <div className="featured-sub">{a.subtitle} · {a.count} fotografii</div>
              </div>
            </a>
          ))}
        </div>
        <div className="section-foot">
          <a href="#/albume" className="link-arrow">Toate albumele →</a>
        </div>
      </section>

      <section className="featured-films">
        <div className="section-head">
          <div className="section-eyebrow">Filme</div>
          <h2 className="section-title">Trei proiecte cinematografice</h2>
        </div>
        <div className="featured-grid">
          {FILMS.map((f) => (
            <a key={f.id} href={`#/filme/${f.id}`} className="featured-card film-card">
              <div className="featured-cover">
                <img src={f.cover} alt={f.title} />
                <div className="film-card-status">{f.status}</div>
              </div>
              <div className="featured-meta">
                <div className="featured-title">{f.title}</div>
                <div className="featured-sub">{f.subtitle} · {f.duration}</div>
              </div>
            </a>
          ))}
        </div>
        <div className="section-foot">
          <a href="#/filme" className="link-arrow">Toate filmele →</a>
        </div>
      </section>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// FILMS LIST
// ───────────────────────────────────────────────────────────────────────────

function FilmsList() {
  const { films: FILMS } = usePortfolioContent();
  return (
    <main className="page page-films fade-in">
      <header className="page-header">
        <div className="page-eyebrow">Lucrări</div>
        <h1 className="page-title">Filme</h1>
        <p className="page-lede">
          Trei proiecte cinematografice — un scurtmetraj lansat, un lungmetraj
          în dezvoltare și un documentar de eseu în post-producție.
        </p>
      </header>

      <div className="films-list">
        {FILMS.map((f, i) => (
          <a key={f.id} href={`#/filme/${f.id}`} className="film-row">
            <div className="film-row-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="film-row-cover">
              <img src={f.cover} alt={f.title} />
              <div className="film-card-status">{f.status}</div>
            </div>
            <div className="film-row-meta">
              <h3 className="film-row-title">{f.title}</h3>
              <div className="film-row-sub">{f.subtitle}</div>
              <p className="film-row-synopsis">{f.synopsis}</p>
              <div className="film-row-specs">
                <div><span className="spec-label">An</span><span>{f.year}</span></div>
                <div><span className="spec-label">Durată</span><span>{f.duration}</span></div>
                <div><span className="spec-label">Rol</span><span>{f.role}</span></div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// FILM DETAIL
// ───────────────────────────────────────────────────────────────────────────

function FilmDetail({ id }: { id: string }) {
  const { films: FILMS } = usePortfolioContent();
  const film = FILMS.find((f) => f.id === id);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null || !film) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => Math.min(film.stills.length - 1, (i ?? 0) + 1));
      if (e.key === "ArrowLeft") setLightbox((i) => Math.max(0, (i ?? 0) - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, film]);

  if (!film) {
    return (
      <main className="page fade-in">
        <p style={{ padding: "120px 60px" }}>Filmul nu a fost găsit. <a href="#/filme">Înapoi</a></p>
      </main>
    );
  }

  return (
    <main className="page page-film-detail fade-in">
      <header className="album-header">
        <a href="#/filme" className="back-link">← Filme</a>
        <div className="album-meta-row">
          <span className="album-meta-piece">{film.year}</span>
          <span className="album-meta-piece">{film.duration}</span>
          <span className="album-meta-piece">{film.status}</span>
        </div>
        <h1 className="album-title">{film.title}</h1>
        <p className="album-lede">{film.subtitle}</p>
      </header>

      <div className="film-detail-grid">
        <div className="film-detail-synopsis">
          <div className="film-detail-label">Sinopsis</div>
          <p>{film.synopsis}</p>
        </div>
        <div className="film-detail-credits">
          <div className="film-detail-label">Credite & festivaluri</div>
          <dl className="film-credits-list">
            <dt>Rol</dt><dd>{film.role}</dd>
            <dt>An</dt><dd>{film.year}</dd>
            <dt>Durată</dt><dd>{film.duration}</dd>
            <dt>Stadiu</dt><dd>{film.status}</dd>
          </dl>
          <ul className="film-festivals">
            {film.festivals.map((fe, i) => (
              <li key={i}>{fe}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="film-stills-head">
        <div className="section-eyebrow">Cadre din film</div>
      </div>
      <div className="gallery-masonry">
        {film.stills.map((p, i) => (
          <figure
            key={i}
            className={"gallery-masonry-item " + (i % 3 === 0 ? "wide" : "")}
            onClick={() => setLightbox(i)}
          >
            <img src={p.src} alt={p.caption} />
            <figcaption>
              <span className="cap-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="cap-text">{p.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={film.stills}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onChange={setLightbox}
        />
      )}
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// ALBUMS LIST
// ───────────────────────────────────────────────────────────────────────────

function AlbumsList({ density }: { density: "spacious" | "comfortable" | "compact" }) {
  const { albums: ALBUMS } = usePortfolioContent();
  return (
    <main className="page page-albums fade-in">
      <header className="page-header">
        <div className="page-eyebrow">Lucrări</div>
        <h1 className="page-title">Albume</h1>
        <p className="page-lede">
          Trei serii de fotografie documentară, realizate între 2023 și 2024 —
          orașul, mănăstirea, interiorul.
        </p>
      </header>

      <div className={"albums-grid albums-grid-" + density}>
        {ALBUMS.map((a, i) => (
          <a key={a.id} href={`#/albume/${a.id}`} className="album-card">
            <div className="album-card-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="album-card-cover">
              <img src={a.cover} alt={a.title} />
            </div>
            <div className="album-card-meta">
              <h3 className="album-card-title">{a.title}</h3>
              <div className="album-card-row">
                <span>{a.location}</span>
                <span>{a.year}</span>
              </div>
              <div className="album-card-count">{a.count} fotografii</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// ALBUM DETAIL
// ───────────────────────────────────────────────────────────────────────────

function AlbumDetail({ id }: { id: string }) {
  const { albums: ALBUMS } = usePortfolioContent();
  const album = ALBUMS.find((a) => a.id === id);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null || !album) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => Math.min(album.photos.length - 1, (i ?? 0) + 1));
      if (e.key === "ArrowLeft") setLightbox((i) => Math.max(0, (i ?? 0) - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, album]);

  if (!album) {
    return (
      <main className="page fade-in">
        <p style={{ padding: "120px 60px" }}>Albumul nu a fost găsit. <a href="#/albume">Înapoi</a></p>
      </main>
    );
  }

  return (
    <main className="page page-album-detail fade-in">
      <header className="album-header">
        <a href="#/albume" className="back-link">← Albume</a>
        <div className="album-meta-row">
          <span className="album-meta-piece">{album.location}</span>
          <span className="album-meta-piece">{album.year}</span>
          <span className="album-meta-piece">{album.count} fotografii</span>
        </div>
        <h1 className="album-title">{album.title}</h1>
        <p className="album-lede">{album.description}</p>
      </header>

      <div className="gallery-masonry">
        {album.photos.map((p, i) => (
          <figure
            key={i}
            className={"gallery-masonry-item " + (i % 5 === 0 ? "wide" : "")}
            onClick={() => setLightbox(i)}
          >
            <img src={p.src} alt={p.caption} />
            <figcaption>
              <span className="cap-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="cap-text">{p.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={album.photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onChange={setLightbox}
        />
      )}
    </main>
  );
}

function Lightbox({ photos, index, onClose, onChange }: { photos: Photo[]; index: number; onClose: () => void; onChange: (index: number) => void }) {
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>Închide ✕</button>
      <button
        className="lightbox-nav lightbox-prev"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onChange(Math.max(0, index - 1)); }}
        disabled={index === 0}
      >←</button>
      <figure className="lightbox-figure" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
        <img src={photos[index].src} alt={photos[index].caption} />
        <figcaption>
          <span className="cap-num">{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
          <span className="cap-text">{photos[index].caption}</span>
        </figcaption>
      </figure>
      <button
        className="lightbox-nav lightbox-next"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onChange(Math.min(photos.length - 1, index + 1)); }}
        disabled={index === photos.length - 1}
      >→</button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// ABOUT
// ───────────────────────────────────────────────────────────────────────────

function About() {
  const { aboutText: ABOUT_TEXT } = usePortfolioContent();
  return (
    <main className="page page-about fade-in">
      <header className="page-header">
        <div className="page-eyebrow">Biografie</div>
        <h1 className="page-title">Despre Andrei</h1>
      </header>

      <div className="about-grid">
        <aside className="about-portrait">
          <div className="portrait-placeholder portrait-placeholder-tall">
            <div className="portrait-placeholder-inner">
              <div className="placeholder-label">Portret</div>
              <div className="placeholder-sub">a se înlocui cu fotografia lui Andrei</div>
            </div>
          </div>
          <div className="about-portrait-cap">
            <span className="cap-num">—</span>
            <span className="cap-text">fotografie de Ștefan Tuchilă, 2024</span>
          </div>
        </aside>

        <div className="about-body">
          {ABOUT_TEXT.map((p, i) => (
            <p key={i} className="about-paragraph">{p}</p>
          ))}

          <div className="about-roles">
            <div className="role">
              <div className="role-label">01 — Fotograf</div>
              <p>Fotografie documentară și de noapte. Trei albume publicate, expoziții la Timișoara, Cluj și București. Lucrează cu Leica M10 Monochrom și Hasselblad 500C/M.</p>
            </div>
            <div className="role">
              <div className="role-label">02 — Scenarist</div>
              <p>Absolvent UNATC (2017). Scenariile <em>Pendulul</em> (scurt, 2021) și <em>Sub fereastră</em> (lungmetraj, în dezvoltare) au fost selectate la TIFF și Cinepolitica.</p>
            </div>
            <div className="role">
              <div className="role-label">03 — Teolog</div>
              <p>Studii de teologie ortodoxă la Sibiu. Eseuri despre artă sacră și fenomenologia privirii — în <em>Dilema veche</em>, <em>Verso</em> și <em>Studia Theologica</em>.</p>
            </div>
          </div>

          <div className="about-cv">
            <h3 className="about-cv-title">Selecție expozițională</h3>
            <ul className="about-cv-list">
              <li><span className="cv-year">2024</span> <span>„Noctambul" — Galeria Calina, Timișoara</span></li>
              <li><span className="cv-year">2024</span> <span>„Lumina necreată" — grupată, MNAC, București</span></li>
              <li><span className="cv-year">2023</span> <span>„Mănăstiri" — Casa Filipescu-Cesianu, București</span></li>
              <li><span className="cv-year">2022</span> <span>„Banat, alb-negru" — Pavilion 32, Timișoara</span></li>
              <li><span className="cv-year">2021</span> <span>„Pendulul" — TIFF, Cluj-Napoca</span></li>
            </ul>
          </div>

          <div className="about-contact">
            <div className="about-contact-label">Pentru proiecte, comenzi sau colaborări</div>
            <a href="mailto:andreiraresbandi@gmail.com" className="about-contact-mail">andreiraresbandi@gmail.com</a>
          </div>
        </div>
      </div>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// JOURNAL
// ───────────────────────────────────────────────────────────────────────────

function Journal() {
  const { journal: JOURNAL } = usePortfolioContent();
  const eseuri = JOURNAL.filter((j) => j.kind === "eseu");
  const note = JOURNAL.filter((j) => j.kind === "notă");

  return (
    <main className="page page-journal fade-in">
      <header className="page-header">
        <div className="page-eyebrow">Texte</div>
        <h1 className="page-title">Jurnal</h1>
        <p className="page-lede">
          Eseuri despre fotografie, scenaristică și teologie — și note scurte
          de pe drum, scrise atunci când o singură imagine nu e de ajuns.
        </p>
      </header>

      <section className="journal-section">
        <div className="journal-section-head">
          <span className="journal-section-num">I.</span>
          <h2 className="journal-section-title">Eseuri</h2>
        </div>
        <div className="journal-list">
          {eseuri.map((j) => (
            <a key={j.id} href={`#/jurnal/${j.id}`} className="journal-item">
              <div className="journal-item-meta">
                <span>{j.date}</span>
                <span>·</span>
                <span>{j.readTime} de citit</span>
              </div>
              <h3 className="journal-item-title">{j.title}</h3>
              <p className="journal-item-excerpt">{j.excerpt}</p>
              <span className="journal-item-link">Citește →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="journal-section">
        <div className="journal-section-head">
          <span className="journal-section-num">II.</span>
          <h2 className="journal-section-title">Note de drum</h2>
        </div>
        <div className="journal-notes">
          {note.map((j) => (
            <a key={j.id} href={`#/jurnal/${j.id}`} className="journal-note">
              <div className="journal-note-date">{j.date}</div>
              <h4 className="journal-note-title">{j.title}</h4>
              <p className="journal-note-excerpt">{j.excerpt}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function Article({ id }: { id: string }) {
  const { journal: JOURNAL } = usePortfolioContent();
  const article = JOURNAL.find((j) => j.id === id);
  if (!article) {
    return (
      <main className="page fade-in">
        <p style={{ padding: "120px 60px" }}>Articolul nu a fost găsit. <a href="#/jurnal">Înapoi</a></p>
      </main>
    );
  }
  return (
    <main className="page page-article fade-in">
      <a href="#/jurnal" className="back-link">← Jurnal</a>
      <article className="article">
        <div className="article-meta">
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.kind}</span>
          <span>·</span>
          <span>{article.readTime} de citit</span>
        </div>
        <h1 className="article-title">{article.title}</h1>
        <p className="article-dropcap">{article.body[0]}</p>
        {article.body.slice(1).map((p, i) => (
          <p key={i} className="article-paragraph">{p}</p>
        ))}
        <div className="article-end">— A.B.</div>
      </article>
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// APP
// ───────────────────────────────────────────────────────────────────────────

export default function App({ content }: { content: PortfolioContent }) {
  const [route, setRoute] = useState<Route>({ page: "home" });

  useEffect(() => {
    const update = () => setRoute(parseHash());
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  let view;
  switch (route.page) {
    case "albums":
      view = <AlbumsList density="comfortable" />;
      break;
    case "album":
      view = <AlbumDetail id={route.id} />;
      break;
    case "films":
      view = <FilmsList />;
      break;
    case "film":
      view = <FilmDetail id={route.id} />;
      break;
    case "about":
      view = <About />;
      break;
    case "journal":
      view = <Journal />;
      break;
    case "article":
      view = <Article id={route.id} />;
      break;
    default:
      view = <Home />;
  }

  return (
    <PortfolioContentContext.Provider value={content}>
      <div className="site" data-route={route.page}>
        <Header route={route} />
        {view}
        <Footer />
      </div>
    </PortfolioContentContext.Provider>
  );
}
