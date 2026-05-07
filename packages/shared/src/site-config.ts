export const SITE_CONFIG = {
  name: "Andrei Bândilă",
  defaultUrl: "https://andreibandila.ro",
  email: "andreiraresbandi@gmail.com",
  location: "",
  socialLinks: [
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
  ],
} as const;

export const LANDING_HERO_IMAGES = [
  {
    src: "/photos/landing/hero-01.jpg",
    alt: "Lumânări la utrenia Învierii",
    caption: "Lumânări la utrenia Învierii",
  },
  {
    src: "/photos/landing/hero-02.jpg",
    alt: "Trapeza, după rugăciune",
    caption: "Trapeza, după rugăciune",
  },
  {
    src: "/photos/landing/hero-03.jpg",
    alt: "Convorbire, în cimitirul mănăstirii",
    caption: "Convorbire, în cimitirul mănăstirii",
  },
] as const;

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? SITE_CONFIG.defaultUrl;
}
