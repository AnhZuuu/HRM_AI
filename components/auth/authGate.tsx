"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => {
    if (p === "/") return pathname === "/";               // exact match for root
    return pathname === p || pathname.startsWith(p + "/"); // allow nested under public routes
  });
}

function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPublic(pathname)) {
      setReady(true);
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  // Optional: react to logout in other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken" && !e.newValue) router.replace("/login");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  return ready;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const ready = useRequireAuth();
  if (!ready) return null; // or a loading skeleton
  return <>{children}</>;
}
