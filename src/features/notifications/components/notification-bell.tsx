"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

type Notification = { id: string; title: string; message: string; readAt: string | null; createdAt: string };
export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]); const [open, setOpen] = useState(false);
  useEffect(() => { fetch("/api/notifications").then((response) => response.ok ? response.json() : null).then((data) => data && setItems(data.notifications ?? [])).catch(() => undefined); }, []);
  const unread = items.filter((item) => !item.readAt).length;
  return <details className="group relative" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}><summary aria-label="Bildirimler" className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-line text-muted transition hover:bg-surface-strong hover:text-foreground [&::-webkit-details-marker]:hidden"><Bell className="h-4 w-4" />{unread > 0 ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span> : null}</summary><div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-line bg-surface p-3 shadow-2xl"><div className="flex items-center justify-between px-2"><p className="font-semibold">Bildirimler</p>{unread ? <button className="text-xs text-accent" onClick={() => { fetch("/api/notifications", { method: "PATCH" }); setItems((current) => current.map((item) => ({ ...item, readAt: new Date().toISOString() }))); }} type="button">Tümünü okundu işaretle</button> : null}</div><div className="mt-2 grid max-h-80 gap-1 overflow-y-auto">{items.length ? items.map((item) => <div className={`rounded-xl p-3 text-sm ${item.readAt ? "" : "bg-accent/10"}`} key={item.id}><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted">{item.message}</p></div>) : <p className="p-4 text-sm text-muted">Yeni bildiriminiz yok.</p>}</div></div></details>;
}
