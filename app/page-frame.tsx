"use client";

/**
 * Bumps a key on every pathname change so the wrapper remounts on every
 * client-side navigation, which makes its CSS animation (.route-fade) replay
 * on entry. Cheap, no dependency, no view-transition complexity.
 *
 * Wrapping happens *between* the header/footer and the page content, so only
 * the main content area animates on route change — the chrome stays put.
 */

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function PageFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-fade">
      {children}
    </div>
  );
}
