// components/route-transition-overlay.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteTransitionOverlay({
  minMs = Number(process.env.NEXT_PUBLIC_MIN_ROUTE_OVERLAY_MS ?? 0) || 350,
  maxMs = 2000,
}: {
  minMs?: number;
  maxMs?: number;
}) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Trigger on every pathname change
    setActive(true);

    // Ensure it shows at least minMs and auto-hide by maxMs as safety
    const minT = setTimeout(() => setActive(false), minMs);
    const maxT = setTimeout(() => setActive(false), maxMs);

    return () => {
      clearTimeout(minT);
      clearTimeout(maxT);
    };
  }, [pathname, minMs, maxMs]);

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[2147483646] transition-opacity duration-200 pointer-events-none ${
        active ? "opacity-100" : "opacity-0"
      }`}
      // light translucent tint + no pointer capture so toasts remain clickable
      style={{ background: "rgba(0,0,0,0.06)" }}
    />
  );
}
