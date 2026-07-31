"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type YouTubeCredentialFormProps = {
  initialStatus: {
    configured: boolean;
    active: boolean;
    maskedApiKey: string | null;
    lastTestedAt: string | null;
    lastTestError: string | null;
    updatedAt: string | null;
  };
};

type RequestResult = {
  success?: boolean;
  message?: string;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Henüz test edilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function YouTubeCredentialForm({
  initialStatus,
}: YouTubeCredentialFormProps) {
  const router = useRouter();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [loadingAction, setLoadingAction] = useState<
    "save" | "test" | "delete" | null
  >(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function refreshStatus() {
    const response = await fetch(
      "/api/admin/integrations/youtube/credentials",
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return;
    }

    setStatus(await response.json());
  }

  async function saveCredential() {
    const normalized = apiKey.trim();

    if (!normalized) {
      setMessage({
        type: "error",
        text: "YouTube API anahtarını girin.",
      });

      return;
    }

    setLoadingAction("save");
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/integrations/youtube/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: normalized,
          }),
        },
      );

      const result =
        (await response.json()) as RequestResult;

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "API anahtarı kaydedilemedi.",
        );
      }

      setApiKey("");
      await refreshStatus();

      setMessage({
        type: "success",
        text:
          result.message ||
          "YouTube API anahtarı kaydedildi.",
      });

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "API anahtarı kaydedilemedi.",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  async function testCredential() {
    setLoadingAction("test");
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/integrations/youtube/credentials",
        {
          method: "PATCH",
        },
      );

      const result =
        (await response.json()) as RequestResult;

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Bağlantı testi başarısız.",
        );
      }

      await refreshStatus();

      setMessage({
        type: "success",
        text:
          result.message ||
          "YouTube API bağlantısı başarılı.",
      });

      router.refresh();
    } catch (error) {
      await refreshStatus();

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Bağlantı testi başarısız.",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeCredential() {
    const confirmed = window.confirm(
      "Kayıtlı YouTube API anahtarı silinsin mi?",
    );

    if (!confirmed) {
      return;
    }

    setLoadingAction("delete");
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/integrations/youtube/credentials",
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as RequestResult;

      if (!response.ok) {
        throw new Error(
          result.error || "API anahtarı silinemedi.",
        );
      }

      setStatus({
        configured: false,
        active: false,
        maskedApiKey: null,
        lastTestedAt: null,
        lastTestError: null,
        updatedAt: null,
      });

      setMessage({
        type: "success",
        text: "YouTube API anahtarı silindi.",
      });

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "API anahtarı silinemedi.",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <Video className="size-6" />
            </span>

            <div>
              <h2 className="text-xl font-semibold">
                YouTube Data API
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Türkiye ve global müzik listeleri için
                kullanılacak API anahtarını buradan yönetin.
                Anahtar tarayıcıya geri gönderilmez.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              status.configured && status.active
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-700"
            }`}
          >
            {status.configured && status.active ? (
              <CheckCircle2 className="size-3.5" />
            ) : null}

            {status.configured && status.active
              ? "Bağlı"
              : status.configured
                ? "Anahtar pasif"
                : "Yapılandırılmadı"}
          </span>
        </div>

        {status.configured ? (
          <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-background p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Kayıtlı anahtar
              </p>

              <p className="mt-2 font-mono text-sm">
                {status.maskedApiKey}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Son bağlantı testi
              </p>

              <p className="mt-2 text-sm">
                {formatDate(status.lastTestedAt)}
              </p>
            </div>
          </div>
        ) : null}

        {status.lastTestError ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700">
            {status.lastTestError}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <label
          className="text-sm font-semibold"
          htmlFor="youtube-api-key"
        >
          {status.configured
            ? "YouTube API anahtarını değiştir"
            : "YouTube API anahtarı"}
        </label>

        <p className="mt-1 text-xs leading-5 text-muted">
          Google Cloud Console üzerinden oluşturduğunuz
          YouTube Data API v3 anahtarını girin.
        </p>

        <div className="mt-4 flex rounded-2xl border border-line bg-background p-1.5 focus-within:border-accent">
          <input
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm outline-none"
            id="youtube-api-key"
            onChange={(event) =>
              setApiKey(event.target.value)
            }
            placeholder="AIza..."
            type={showKey ? "text" : "password"}
            value={apiKey}
          />

          <button
            aria-label={
              showKey
                ? "API anahtarını gizle"
                : "API anahtarını göster"
            }
            className="inline-flex size-10 items-center justify-center rounded-xl text-muted hover:bg-surface-strong hover:text-foreground"
            onClick={() =>
              setShowKey((current) => !current)
            }
            type="button"
          >
            {showKey ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        {message ? (
          <div
            className={`mt-4 rounded-2xl border p-4 text-sm ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700"
                : "border-red-500/20 bg-red-500/5 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              loadingAction !== null || !apiKey.trim()
            }
            onClick={() => void saveCredential()}
            type="button"
          >
            {loadingAction === "save" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            Kaydet ve test et
          </button>

          {status.configured ? (
            <>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                disabled={loadingAction !== null}
                onClick={() => void testCredential()}
                type="button"
              >
                {loadingAction === "test" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}

                Bağlantıyı test et
              </button>

              <button
                className="inline-flex items-center gap-2 rounded-full border border-red-500/20 px-5 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                disabled={loadingAction !== null}
                onClick={() => void removeCredential()}
                type="button"
              >
                {loadingAction === "delete" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}

                Anahtarı sil
              </button>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
