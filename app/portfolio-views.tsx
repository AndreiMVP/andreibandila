import Image, { getImageProps } from "next/image";
import type { ReactNode } from "react";
import Link from "next/link";
import { getSiteUrl, LANDING_HERO_IMAGES, SITE_CONFIG } from "@andreibandila/shared";
import type { Album, Film, JournalEntry, PortfolioContent } from "@andreibandila/shared";
import AlbumGalleryClient from "./album-gallery-client";

const SITE_URL = getSiteUrl();

function PortfolioImage({ src, alt, className, priority = false, sizes = "(min-width: 900px) 50vw, 100vw" }: { src: string; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  if (!src) return null;
  return <Image src={src} alt={alt} className={className} width={1800} height={1200} sizes={sizes} priority={priority} />;
}

function ArtDirectedHeroImage({ desktop, mobile }: { desktop: { src: string; alt: string }; mobile: { src: string; alt: string } }) {
  const { props: mobileImageProps } = getImageProps({ src: mobile.src, alt: mobile.alt, width: 1800, height: 1200, sizes: "100vw" });

  return (
    <picture className="home-hero-picture">
      <source media="(max-width: 700px)" srcSet={mobileImageProps.srcSet} sizes={mobileImageProps.sizes} />
      <Image src={desktop.src} alt="Fotografie de intrare din portofoliul Andrei Bândilă" width={1800} height={1200} sizes="100vw" priority />
    </picture>
  );
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function plainTextFromMarkdown(value = "") {
  return value
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeHref(href: string) {
  return /^(https?:\/\/|mailto:|\/)/.test(href) ? href : "#";
}

function linkProps(href: string) {
  const safe = safeHref(href);
  const external = /^https?:\/\//.test(safe);
  return external ? { href: safe, target: "_blank", rel: "noreferrer" } : { href: safe };
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const link = /^\[([^\]]+)]\(([^)]+)\)$/.exec(part);
    if (link) return <a key={index} {...linkProps(link[2])}>{link[1]}</a>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function MarkdownText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/\n\s*\n/g).map((block) => block.trim()).filter(Boolean);
  return (
    <div className={["markdown-body", className].filter(Boolean).join(" ")}>
      {blocks.map((block, index) => {
        const lines = block.split(/\n/g).map((line) => line.trim()).filter(Boolean);
        if (lines.every((line) => line.startsWith("- "))) {
          return <ul key={index}>{lines.map((line, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(line.slice(2))}</li>)}</ul>;
        }
        return <p key={index}>{renderInlineMarkdown(lines.join(" "))}</p>;
      })}
    </div>
  );
}

export function Home({ content }: { content: PortfolioContent }) {
  const { albums: ALBUMS, films: FILMS } = content;
  const hero = LANDING_HERO_IMAGES[0];
  const mobileHero = LANDING_HERO_IMAGES[2];
  const thresholdPhoto = LANDING_HERO_IMAGES[1];
  const selectedWorks = [
    ...ALBUMS.slice(0, 2).map((a) => ({ id: `album-${a.id}`, href: `/foto/${a.id}`, image: a.cover, title: a.title, eyebrow: "Fotografie", meta: `${a.location} · ${a.year}`, description: a.description })),
    ...FILMS.slice(0, 2).map((f) => ({ id: `film-${f.id}`, href: `/film/${f.id}`, image: f.cover, title: f.title, eyebrow: "Film", meta: [f.subtitle, f.year].filter(Boolean).join(" · "), description: plainTextFromMarkdown(f.description) })),
  ].filter((work) => work.title);

  return (
    <main className="page page-home">
      {hero && (
        <section className="home-fullbleed" aria-label="Imagine de intrare">
          <figure className="home-fullbleed-photo">
            <ArtDirectedHeroImage desktop={hero} mobile={mobileHero} />
            <figcaption>
              <span className="cap-num">01</span>
              <span className="cap-text cap-text-desktop">{hero.caption}</span>
              <span className="cap-text cap-text-mobile">{mobileHero.caption}</span>
            </figcaption>
          </figure>
        </section>
      )}

      <section className="home-statement home-reveal">
        <div className="home-statement-kicker">Fotografie · scenaristică · teologie</div>
        <p className="home-statement-text">
          O practică a privirii: imagini, filme și texte despre lume ca loc al
          revelației discrete — acolo unde lumina, tăcerea și oamenii se lasă văzuți.
        </p>
        <Link href="/despre" className="portrait-link">Despre Andrei →</Link>
      </section>

      {thresholdPhoto && (
        <section className="home-threshold home-reveal" aria-label="Pauză fotografică">
          <figure className="home-threshold-photo">
            <PortfolioImage src={thresholdPhoto.src} alt={thresholdPhoto.alt} sizes="100vw" />
            <figcaption>
              <span className="cap-num">02</span>
              <span className="cap-text">{thresholdPhoto.caption}</span>
            </figcaption>
          </figure>
        </section>
      )}

      <section className="selected-works home-reveal reveal-delay-1">
        <div className="selected-works-head">
          <div className="section-eyebrow">Lucrări alese</div>
          <h2 className="section-title">Fotografii și filme dintr-un fel de a privi</h2>
        </div>
        <div className="selected-works-grid">
          {selectedWorks.map((work, i) => (
            <Link key={work.id} href={work.href} className={"selected-work" + (i === 0 ? " selected-work-large" : "") + (!work.image ? " selected-work-text" : "")}>
              {work.image && (
                <div className="selected-work-cover">
                  <PortfolioImage src={work.image} alt={work.title} sizes={i === 0 ? "(min-width: 900px) 58vw, 100vw" : "(min-width: 900px) 28vw, 100vw"} />
                </div>
              )}
              <div className="selected-work-copy">
                <div className="selected-work-eyebrow">{work.eyebrow}</div>
                <h3 className="selected-work-title">{work.title}</h3>
                <div className="selected-work-meta">{work.meta}</div>
                <p className="selected-work-description">{work.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="section-foot selected-works-foot">
          <Link href="/foto" className="link-arrow">Foto →</Link>
          <Link href="/film" className="link-arrow">Film →</Link>
          <Link href="/jurnal" className="link-arrow">Jurnal →</Link>
        </div>
      </section>

      <section className="home-bio-fragment home-reveal reveal-delay-2">
        <p>
          Între document și contemplație, Andrei caută imagini care nu explică totul,
          ci păstrează o parte din taină.
        </p>
        <Link href="/despre" className="portrait-link">Citește biografia →</Link>
      </section>
    </main>
  );
}

export function FilmsList({ films: FILMS }: { films: Film[] }) {
  return (
    <main className="page page-films">
      <header className="page-header">
        <div className="page-eyebrow">Lucrări</div>
        <h1 className="page-title">Film</h1>
        <p className="page-lede">Proiecte cinematografice, de la scurtmetraj la documentar și lungmetraj.</p>
      </header>

      <div className="films-list">
        {FILMS.map((f, i) => (
          <Link key={f.id} href={`/film/${f.id}`} className="film-row">
            <div className="film-row-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="film-row-cover">
              <PortfolioImage src={f.cover} alt={f.title} sizes="(min-width: 900px) 33vw, 100vw" />
            </div>
            <div className="film-row-meta">
              {f.role && <div className="film-row-role">{f.role}</div>}
              <h3 className="film-row-title">{f.title}</h3>
              <div className="film-row-sub">{f.subtitle}</div>
              <p className="film-row-synopsis">{plainTextFromMarkdown(f.description)}</p>
              <div className="film-row-specs">
                {f.year && <div><span className="spec-label">An</span><span>{f.year}</span></div>}
                {f.role && <div><span className="spec-label">Rol</span><span>{f.role}</span></div>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function FilmDetail({ film }: { film: Film }) {
  return (
    <main className="page page-film-detail">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Movie", name: film.title, description: film.description, image: film.cover || undefined, url: `${SITE_URL}/film/${film.id}` }} />
      <header className="album-header">
        <div className="album-meta-row">
          {film.year && <span className="album-meta-piece">{film.year}</span>}
          {film.role && <span className="album-meta-piece">{film.role}</span>}
        </div>
        <h1 className="album-title">{film.title}</h1>
        <p className="album-lede">{film.subtitle}</p>
      </header>

      <div className="film-detail-layout">
        {film.cover && (
          <figure className="film-detail-cover">
            <PortfolioImage src={film.cover} alt={film.title} priority sizes="(min-width: 900px) 44vw, 100vw" />
          </figure>
        )}

        <div className="film-detail-grid">
          <div className="film-detail-synopsis">
            <div className="film-detail-label">Sinopsis</div>
            <MarkdownText text={film.description} />
          </div>
          <div className="film-detail-credits">
            <div className="film-detail-label">Credite</div>
            <dl className="film-credits-list">
              {film.role && <><dt>Rol</dt><dd>{film.role}</dd></>}
              {film.year && <><dt>An</dt><dd>{film.year}</dd></>}
            </dl>
          </div>
        </div>
      </div>
      <Link href="/film" className="film-end">← Film</Link>
    </main>
  );
}

export function AlbumsList({ albums: ALBUMS, density }: { albums: Album[]; density: "spacious" | "comfortable" | "compact" }) {
  return (
    <main className="page page-albums">
      <header className="page-header">
        <div className="page-eyebrow">Lucrări</div>
        <h1 className="page-title">Foto</h1>
        <p className="page-lede">Serii de fotografie documentară publicate în arhiva foto.</p>
      </header>

      <div className={"albums-grid albums-grid-" + density}>
        {ALBUMS.map((a, i) => (
          <Link key={a.id} href={`/foto/${a.id}`} className="album-card">
            <div className="album-card-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="album-card-cover">
              <PortfolioImage src={a.cover} alt={a.title} sizes="(min-width: 900px) 33vw, 100vw" />
            </div>
            <div className="album-card-meta">
              <h3 className="album-card-title">{a.title}</h3>
              <div className="album-card-row">
                <span>{a.location}</span>
                <span>{a.year}</span>
              </div>
              <div className="album-card-count">{a.count} fotografii</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function AlbumDetail({ album }: { album: Album }) {
  return (
    <main className="page page-album-detail">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ImageGallery", name: album.title, description: album.description, image: album.cover || undefined, url: `${SITE_URL}/foto/${album.id}` }} />
      <header className="album-header">
        <div className="album-meta-row">
          <span className="album-meta-piece">{album.location}</span>
          <span className="album-meta-piece">{album.year}</span>
          <span className="album-meta-piece">{album.count} fotografii</span>
        </div>
        <h1 className="album-title">{album.title}</h1>
        <p className="album-lede">{album.description}</p>
      </header>
      <AlbumGalleryClient photos={album.photos} />
      <Link href="/foto" className="album-end">← Foto</Link>
    </main>
  );
}

export function About({ content }: { content: PortfolioContent }) {
  const { aboutText: ABOUT_TEXT, aboutImage, aboutSections, contactEmail } = content;
  return (
    <main className="page page-about">
      <header className="page-header about-header">
        <div className="page-eyebrow">Despre</div>
        <h1 className="page-title">Despre</h1>
        <p className="page-lede about-thesis">
          Fotografia, filmul și teologia se întâlnesc aici ca forme ale aceleiași atenții:
          a privi lumea fără grabă, până când lucrurile simple își recapătă greutatea.
        </p>
      </header>

      <div className="about-grid">
        <aside className="about-portrait">
          {aboutImage ? (
            <div className="about-portrait-frame">
              <PortfolioImage className="about-portrait-img" src={aboutImage} alt={`Portret ${SITE_CONFIG.name}`} sizes="(min-width: 900px) 33vw, 100vw" />
            </div>
          ) : (
            <div className="portrait-placeholder portrait-placeholder-tall">
              <div className="portrait-placeholder-inner">
                <div className="placeholder-label">Portret</div>
                <div className="placeholder-sub">a se înlocui cu fotografia lui Andrei</div>
              </div>
            </div>
          )}
          <div className="about-portrait-cap">
            <span className="cap-num">—</span>
            <span className="cap-text">{SITE_CONFIG.name}</span>
          </div>
        </aside>

        <div className="about-body">
          <section className="about-narrative" aria-label="Biografie">
            {ABOUT_TEXT.map((p, i) => <p key={i} className="about-paragraph">{p}</p>)}
          </section>

          {aboutSections.length > 0 && (
            <section className="about-roles" aria-label="Practici">
              <div className="about-section-label">Practici</div>
              {aboutSections.map((section) => (
                <div className="role" key={section.id}>
                  <div className="role-label">{section.title}</div>
                  <p>{section.body}</p>
                </div>
              ))}
            </section>
          )}

          {contactEmail && (
            <section className="about-contact" aria-label="Contact">
              <div className="about-contact-label">Pentru proiecte, film, fotografie sau dialog</div>
              <a href={`mailto:${contactEmail}`} className="about-contact-mail">{contactEmail}</a>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export function Journal({ journal: JOURNAL }: { journal: JournalEntry[] }) {
  return (
    <main className="page page-journal">
      <header className="page-header">
        <div className="page-eyebrow">Texte</div>
        <h1 className="page-title">Jurnal</h1>
        <p className="page-lede">Texte despre fotografie, scenaristică și teologie — scrise atunci când o singură imagine nu e de ajuns.</p>
      </header>

      <section className="journal-section">
        <div className="journal-list">
          {JOURNAL.map((j, i) => (
            <Link key={j.id} href={`/jurnal/${j.id}`} className={`journal-item${j.image ? "" : " journal-item-no-image"}`}>
              <div className="journal-item-num">{String(i + 1).padStart(2, "0")}</div>
              {j.image && <div className="journal-item-cover"><PortfolioImage className="journal-item-image" src={j.image} alt="" sizes="(min-width: 900px) 50vw, 100vw" /></div>}
              <div className="journal-item-copy">
                <h3 className="journal-item-title">{j.title}</h3>
                <p className="journal-item-excerpt">{j.excerpt}</p>
                <span className="journal-item-link">Citește →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function Article({ article }: { article: JournalEntry }) {
  return (
    <main className="page page-article">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, image: article.image || undefined, url: `${SITE_URL}/jurnal/${article.id}`, author: { "@type": "Person", name: SITE_CONFIG.name } }} />
      <article className={`article${article.image ? " article-with-bg" : ""}`}>
        {article.image && <div className="article-bg" aria-hidden="true"><Image src={article.image} alt="" fill sizes="100vw" priority className="article-bg-image" /></div>}
        <div className="article-content">
          <h1 className="article-title">{article.title}</h1>
          <MarkdownText text={article.body.join("\n\n")} className="article-markdown" />
          <Link href="/jurnal" className="article-end">← Jurnal</Link>
        </div>
      </article>
    </main>
  );
}
