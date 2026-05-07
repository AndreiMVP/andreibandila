"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@andreibandila/shared";

const LIGHTBOX_EXIT_MS = 160;

function GalleryImage({ photo, sizes = "(min-width: 900px) 50vw, 100vw" }: { photo: Photo; sizes?: string }) {
  if (!photo.src) return null;
  return (
    <Image
      src={photo.src}
      alt={photo.caption}
      width={photo.width ?? 1800}
      height={photo.height ?? 1200}
      sizes={sizes}
      placeholder={photo.blurDataURL ? "blur" : "empty"}
      blurDataURL={photo.blurDataURL ?? undefined}
    />
  );
}

function preloadPhoto(photo?: Photo, sizes = "100vw") {
  if (!photo?.src) return;
  const { props } = getImageProps({
    src: photo.src,
    alt: "",
    width: photo.width ?? 1800,
    height: photo.height ?? 1200,
    sizes,
  });
  const img = new window.Image();
  img.decoding = "async";
  img.sizes = props.sizes ?? sizes;
  img.srcset = props.srcSet ?? "";
  img.src = props.src;
  void img.decode?.().catch(() => undefined);
}

export default function AlbumGalleryClient({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const open = useCallback((index: number) => {
    preloadPhoto(photos[index]);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null;
    setClosing(false);
    setLightbox(index);
  }, [photos]);

  const close = useCallback(() => {
    if (lightbox === null || closing) return;
    setClosing(true);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setLightbox(null);
      setClosing(false);
      closeTimerRef.current = null;
    }, LIGHTBOX_EXIT_MS);
  }, [closing, lightbox]);

  // Keyboard navigation while the lightbox is open.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (!closing && e.key === "ArrowRight") setLightbox((i) => Math.min(photos.length - 1, (i ?? 0) + 1));
      else if (!closing && e.key === "ArrowLeft") setLightbox((i) => Math.max(0, (i ?? 0) - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length, close, closing]);

  // Preload adjacent images so next/previous feels immediate.
  useEffect(() => {
    if (lightbox === null) return;
    preloadPhoto(photos[lightbox - 1]);
    preloadPhoto(photos[lightbox + 1]);
  }, [lightbox, photos]);

  // Body scroll lock + initial focus + return focus on close.
  const isOpen = lightbox !== null;
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <>
      <div className="gallery-masonry">
        {photos.map((p, i) => (
          <figure
            key={i}
            className={"gallery-masonry-item " + (i % 5 === 0 ? "wide" : "")}
            role="button"
            tabIndex={0}
            aria-label={`Deschide fotografia ${i + 1}${p.caption ? `: ${p.caption}` : ""}`}
            onClick={() => open(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(i);
              }
            }}
          >
            <GalleryImage photo={p} />
            <figcaption>
              <span className="cap-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="cap-text">{p.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {lightbox !== null && (
        <div
          className={"lightbox" + (closing ? " is-closing" : "")}
          role="dialog"
          aria-modal="true"
          aria-label={photos[lightbox].caption || `Fotografia ${lightbox + 1} din ${photos.length}`}
          onClick={close}
        >
          <button ref={closeRef} type="button" className="lightbox-close" onClick={close}>Închide ✕</button>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={(e) => { e.stopPropagation(); setLightbox(Math.max(0, lightbox - 1)); }}
            disabled={lightbox === 0 || closing}
            aria-label="Fotografia precedentă"
          >←</button>
          <figure key={lightbox} className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
            <GalleryImage photo={photos[lightbox]} sizes="100vw" />
            <figcaption>
              <span className="cap-num">{String(lightbox + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
              <span className="cap-text">{photos[lightbox].caption}</span>
            </figcaption>
          </figure>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={(e) => { e.stopPropagation(); setLightbox(Math.min(photos.length - 1, lightbox + 1)); }}
            disabled={lightbox === photos.length - 1 || closing}
            aria-label="Fotografia următoare"
          >→</button>
        </div>
      )}
    </>
  );
}
