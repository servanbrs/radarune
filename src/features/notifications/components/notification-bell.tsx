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
  useRef,
  useState,
} from "react";

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

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NotificationBell() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
            ? "Bildirimleri görmek için giriş yapmalısınız."
            : "Bildirimler alınamadı.",
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
          : "Bildirimler alınamadı.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialRequest = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const interval = window.setInterval(() => {
      void loadNotifications(true);
    }, 60_000);

    return () => {
      window.clearTimeout(initialRequest);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

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
        throw new Error("Bildirimler güncellenemedi.");
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
          : "Bildirimler güncellenemedi.",
      );
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-expanded={open}
        aria-label="Bildirimler"
        className="relative inline-flex size-10 items-center justify-center rounded-full border border-black/5 bg-white text-black/65 shadow-sm transition hover:border-black/10 hover:bg-black/[0.04] hover:text-black"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell className="size-5" />

        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b8274] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          aria-label="Bildirim listesi"
          className="absolute right-0 top-12 z-[100] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        >
          <header className="flex items-center justify-between border-b border-black/5 px-4 py-4">
            <div>
              <p className="text-sm font-bold text-black">
                Bildirimler
              </p>

              <p className="mt-0.5 text-xs text-black/45">
                {unread
                  ? `${unread} okunmamış bildirim`
                  : "Yeni bildirim bulunmuyor"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                aria-label="Bildirimleri yenile"
                className="inline-flex size-9 items-center justify-center rounded-full text-black/45 transition hover:bg-black/5 hover:text-black"
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
                aria-label="Bildirimleri kapat"
                className="inline-flex size-9 items-center justify-center rounded-full text-black/45 transition hover:bg-black/5 hover:text-black"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {unread > 0 ? (
            <div className="border-b border-black/5 px-4 py-2">
              <button
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#087d70] disabled:opacity-50"
                disabled={markingRead}
                onClick={() => void markAllRead()}
                type="button"
              >
                {markingRead ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}

                Tümünü okundu işaretle
              </button>
            </div>
          ) : null}

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex min-h-36 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-[#087d70]" />
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
                  Tekrar dene
                </button>
              </div>
            ) : items.length > 0 ? (
              <div className="grid gap-1">
                {items.map((item) => (
                  <article
                    className={`rounded-2xl px-4 py-3 transition ${
                      item.readAt
                        ? "bg-transparent"
                        : "bg-[#0b8274]/[0.07]"
                    }`}
                    key={item.id}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          item.readAt
                            ? "bg-black/15"
                            : "bg-[#0b8274]"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-5 text-black">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-black/55">
                          {item.message}
                        </p>

                        <p className="mt-2 text-[11px] font-medium text-black/35">
                          {formatNotificationDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-[#0b8274]/10 text-[#087d70]">
                  <Bell className="size-5" />
                </span>

                <p className="mt-3 text-sm font-semibold text-black">
                  Bildirim yok
                </p>

                <p className="mt-1 text-xs leading-5 text-black/45">
                  Oylar, yorumlar ve yayın güncellemeleri burada
                  görünecek.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
