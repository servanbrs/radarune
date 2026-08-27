"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const visitorStorageKey = "radarune-visitor-id";
const lastVisitStorageKey = "radarune-last-visit";

function getVisitorId() {
  const existing = window.localStorage.getItem(visitorStorageKey);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(visitorStorageKey, id);
  return id;
}

export function SiteVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const path = `${pathname}${query ? `?${query}` : ""}`;
    const now = Date.now();
    const last = window.sessionStorage.getItem(lastVisitStorageKey);
    if (last && now - Number(last) < 30_000) return;
    window.sessionStorage.setItem(lastVisitStorageKey, String(now));

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, visitorId: getVisitorId() }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}
