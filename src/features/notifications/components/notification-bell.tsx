"use client";

import {
  Bell,
  CheckCheck,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { localize, normalizeLocale, type Locale } from "@/lib/i18n";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationResponse = {
  notifications?: NotificationItem[];
  unread?: number;
};

function formatNotificationDate(value: string, locale: Locale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NotificationBell({ locale = "tr-TR" }: { locale?: string }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const activeLocale = normalizeLocale(locale);
  const copy = useMemo(() => ({
    title: localize(activeLocale, { tr: "Bildirimler", en: "Notifications", de: "Benachrichtigungen" }),
    loginRequired: localize(activeLocale, { tr: "Bildirimleri görmek için giriş yapmalısınız.", en: "You must sign in to view notifications.", de: "Bitte melden Sie sich an, um Benachrichtigungen zu sehen." }),
    loadError: localize(activeLocale, { tr: "Bildirimler alınamadı.", en: "Notifications could not be loaded.", de: "Benachrichtigungen konnten nicht geladen werden." }),
    updateError: localize(activeLocale, { tr: "Bildirimler güncellenemedi.", en: "Notifications could not be updated.", de: "Benachrichtigungen konnten nicht aktualisiert werden." }),
    unread: (count: number) => localize(activeLocale, { tr: `${count} okunmamış bildirim`, en: `${count} unread notification${count === 1 ? "" : "s"}`, de: `${count} ungelesene Benachrichtigung${count === 1 ? "" : "en"}` }),
    empty: localize(activeLocale, { tr: "Yeni bildirim bulunmuyor", en: "No new notifications", de: "Keine neuen Benachrichtigungen" }),
    refresh: localize(activeLocale, { tr: "Bildirimleri yenile", en: "Refresh notifications", de: "Benachrichtigungen aktualisieren" }),
    close: localize(activeLocale, { tr: "Bildirimleri kapat", en: "Close notifications", de: "Benachrichtigungen schließen" }),
    markAll: localize(activeLocale, { tr: "Tümünü okundu işaretle", en: "Mark all as read", de: "Alle als gelesen markieren" }),
    retry: localize(activeLocale, { tr: "Tekrar dene", en: "Try again", de: "Erneut versuchen" }),
    none: localize(activeLocale, { tr: "Bildirim yok", en: "No notifications", de: "Keine Benachrichtigungen" }),
    description: localize(activeLocale, { tr: "Oylar, yorumlar ve yayın güncellemeleri burada görünecek.", en: "Votes, comments and release updates will appear here.", de: "Abstimmungen, Kommentare und Release-Updates erscheinen hier." }),
  }), [activeLocale]);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unread = items.filter((item) => !item.readAt).length;

  const loadNotifications = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? copy.loginRequired
            : copy.loadError,
        );
      }

      const data = (await response.json()) as NotificationResponse;

      setItems(
        Array.isArray(data.notifications)
          ? data.notifications
          : [],
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : copy.loadError,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoaded(true);
    }
  }, [copy]);

  useEffect(() => {
    const initialRequest = !loaded && !loading
      ? window.setTimeout(() => void loadNotifications(), 0)
      : undefined;
    const interval = window.setInterval(() => {
      void loadNotifications(true);
    }, 60_000);
    return () => {
      if (initialRequest) window.clearTimeout(initialRequest);
      window.clearInterval(interval);
    };
  }, [loadNotifications, loaded, loading, open]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick,
      );
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function markAllRead() {
    if (!unread || markingRead) {
      return;
    }

    setMarkingRead(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(copy.updateError);
      }

      const readAt = new Date().toISOString();

      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt ?? readAt,
        })),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : copy.updateError,
      );
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-expanded={open}
        aria-label={copy.title}
        className="relative inline-flex size-10 items-center justify-center rounded-full border border-[#d6a85f]/25 bg-[#151c2d] text-[#f1f3f8] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:border-[#d6a85f]/70 hover:bg-[#202b44] hover:text-[#f4d99e]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell className="size-5" />

        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d6a85f] px-1 text-[10px] font-bold text-[#151c2d] ring-2 ring-[#081311]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          aria-label={copy.title}
          className="absolute right-0 top-12 z-[100] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-[#2b344b] bg-[#121a2b] text-[#f1f3f8] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
        >
          <header className="flex items-center justify-between border-b border-[#2b344b] px-4 py-4">
            <div>
                <p className="text-sm font-bold text-[#f1f3f8]">
                {copy.title}
              </p>

              <p className="mt-0.5 text-xs text-[#b7c2d0]">
                {unread
                  ? copy.unread(unread)
                  : copy.empty}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                aria-label={copy.refresh}
                className="inline-flex size-9 items-center justify-center rounded-full text-[#b7c2d0] transition hover:bg-[#202b44] hover:text-[#f4d99e]"
                disabled={refreshing}
                onClick={() => void loadNotifications(true)}
                type="button"
              >
                <RefreshCw
                  className={`size-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>

              <button
                aria-label={copy.close}
                className="inline-flex size-9 items-center justify-center rounded-full text-[#b7c2d0] transition hover:bg-[#202b44] hover:text-[#f4d99e]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {unread > 0 ? (
            <div className="border-b border-[#2b344b] px-4 py-2">
              <button
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#d6a85f] disabled:opacity-50"
                disabled={markingRead}
                onClick={() => void markAllRead()}
                type="button"
              >
                {markingRead ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}

                {copy.markAll}
              </button>
            </div>
          ) : null}

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex min-h-36 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-[#d6a85f]" />
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>

                <button
                  className="mt-3 text-xs font-semibold text-red-700 underline"
                  onClick={() => void loadNotifications()}
                  type="button"
                >
                  {copy.retry}
                </button>
              </div>
            ) : items.length > 0 ? (
              <div className="grid gap-1">
                {items.map((item) => (
                  <article
                    className={`rounded-2xl px-4 py-3 transition ${
                      item.readAt
                        ? "bg-transparent"
                        : "bg-[#d6a85f]/10"
                    }`}
                    key={item.id}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          item.readAt
                            ? "bg-white/20"
                            : "bg-[#d6a85f]"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-5 text-[#f1f3f8]">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#b7c2d0]">
                          {item.message}
                        </p>

                        <p className="mt-2 text-[11px] font-medium text-[#8793a8]">
                          {formatNotificationDate(item.createdAt, activeLocale)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-[#d6a85f]/10 text-[#d6a85f]">
                  <Bell className="size-5" />
                </span>

                <p className="mt-3 text-sm font-semibold text-[#f1f3f8]">
                  {copy.none}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#b7c2d0]">
                  {copy.description}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
