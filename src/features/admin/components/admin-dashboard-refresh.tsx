"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Keeps the platform control center current without constant database polling. */
export function AdminDashboardRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
