"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@andreibandila/shared";

const LIGHTBOX_EXIT_MS = 160;
// Crossfade between adjacent photos. Short on purpose: when the user is
// arrow-paging through an album the animation must never become the focus.
const LIGHTBOX_SWAP_MS = 200;

// `phase` is fixed when the layer is created and never changes — this is what
// prevents the surviving layer from re-running the initial materialize after
// a crossfade completes (which would read as a flicker).
type Layer = { key: number; index: number; phase: "initial" | "swap" };

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
  // We keep up to two layers in the DOM: the visible photo and (during a
  // crossfade) the photo it's replacing. Stable keys per layer so React
  // doesn't unmount mid-transition; a counter guarantees uniqueness even
  // when the user navigates back to a photo they just came from.
  const [layers, setLayers] = useState<Layer[]>([]);
  const [closing, setClosing] = useState(false);
  const layerKeyRef = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const swapTimerRef = useRef<number | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const isOpen = layers.length > 0;
  const currentIndex = layers.length > 0 ? layers[layers.length - 1].index : null;

  const open = useCallback((index: number) => {
    preloadPhoto(photos[index]);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    if (swapTimerRef.current !== null) window.clearTimeout(swapTimerRef.current);
    swapTimerRef.current = null;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null;
    setClosing(false);
    layerKeyRef.current += 1;
    setLayers([{ key: layerKeyRef.current, index, phase: "initial" }]);
  }, [photos]);

  const navigate = useCallback((nextIndex: number) => {
    if (closing) return;
    if (nextIndex < 0 || nextIndex >= photos.length) return;
    setLayers((prev) => {
      if (prev.length === 0) return prev;
      if (prev[prev.length - 1].index === nextIndex) return prev;
      layerKeyRef.current += 1;
      // Keep at most two: the leaving photo + the new one. If a previous
      // crossfade is still in flight we drop its leaving layer immediately
      // (rapid arrow-paging shouldn't accumulate ghost layers).
      const next: Layer[] = [...prev, { key: layerKeyRef.current, index: nextIndex, phase: "swap" }];
      return next.slice(-2);
    });
  }, [closing, photos.length]);

  const close = useCallback(() => {
    if (!isOpen || closing) return;
    setClosing(true);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setLayers([]);
      setClosing(false);
      closeTimerRef.current = null;
    }, LIGHTBOX_EXIT_MS);
  }, [closing, isOpen]);

  // Drop the leaving layer once its crossfade-out is done.
  useEffect(() => {
    if (layers.length < 2) return;
    if (swapTimerRef.current !== null) window.clearTimeout(swapTimerRef.current);
    swapTimerRef.current = window.setTimeout(() => {
      setLayers((prev) => prev.slice(-1));
      swapTimerRef.current = null;
    }, LIGHTBOX_SWAP_MS);
    return () => {
      if (swapTimerRef.current !== null) {
        window.clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
    };
  }, [layers]);

  // Keyboard navigation while the lightbox is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (!closing && e.key === "ArrowRight") {
        navigate(Math.min(photos.length - 1, (currentIndex ?? 0) + 1));
      } else if (!closing && e.key === "ArrowLeft") {
        navigate(Math.max(0, (currentIndex ?? 0) - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, currentIndex, photos.length, close, closing, navigate]);

  // Preload adjacent images so next/previous feels immediate.
  useEffect(() => {
    if (currentIndex === null) return;
    preloadPhoto(photos[currentIndex - 1]);
    preloadPhoto(photos[currentIndex + 1]);
  }, [currentIndex, photos]);

  // Body scroll lock + initial focus + return focus on close.
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
    if (swapTimerRef.current !== null) window.clearTimeout(swapTimerRef.current);
  }, []);

  const totalLabel = String(photos.length).padStart(2, "0");

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

      {isOpen && currentIndex !== null && (
        <div
          className={"lightbox" + (closing ? " is-closing" : "")}
          role="dialog"
          aria-modal="true"
          aria-label={photos[currentIndex].caption || `Fotografia ${currentIndex + 1} din ${photos.length}`}
          onClick={close}
        >
          <button ref={closeRef} type="button" className="lightbox-close" onClick={close}>Închide ✕</button>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={(e) => { e.stopPropagation(); navigate(Math.max(0, currentIndex - 1)); }}
            disabled={currentIndex === 0 || closing}
            aria-label="Fotografia precedentă"
          >←</button>
          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {layers.map((layer, i) => {
              const isTop = i === layers.length - 1;
              // Phase is fixed on the layer at creation time; never derive it
              // from layers.length (that's what caused the post-swap flicker).
              const stateClass = !isTop
                ? "is-leaving"
                : layer.phase === "initial"
                  ? "is-initial"
                  : "is-swapping-in";
              const photo = photos[layer.index];
              return (
                <figure key={layer.key} className={`lightbox-figure ${stateClass}`} aria-hidden={!isTop || undefined}>
                  <GalleryImage photo={photo} sizes="100vw" />
                  <figcaption>
                    <span className="cap-num">{String(layer.index + 1).padStart(2, "0")} / {totalLabel}</span>
                    <span className="cap-text">{photo.caption}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={(e) => { e.stopPropagation(); navigate(Math.min(photos.length - 1, currentIndex + 1)); }}
            disabled={currentIndex === photos.length - 1 || closing}
            aria-label="Fotografia următoare"
          >→</button>
        </div>
      )}
    </>
  );
}
