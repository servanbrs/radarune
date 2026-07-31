"use client";

import {
  Bot,
  CheckCircle2,
  KeyRound,
  Loader2,
  PlugZap,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ProviderStatus = {
  provider: string;
  label: string;
  configured: boolean;
  active: boolean;
  model: string;
  maskedApiKey: string | null;
  lastTestedAt: string | null;
  lastTestError: string | null;
  autoImportReviewEnabled: boolean;
  autoAcceptEnabled: boolean;
  minimumReadinessScore: number;
  minimumConfidenceScore: number;
};

type ProviderDraft = {
  apiKey: string;
  model: string;
  active: boolean;
  autoImportReviewEnabled: boolean;
  autoAcceptEnabled: boolean;
  minimumReadinessScore: number;
  minimumConfidenceScore: number;
};

const suggestedModels: Record<string, string[]> = {
  OPENAI: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
  GOOGLE_GEMINI: ["gemini-2.5-flash", "gemini-2.5-pro"],
  ANTHROPIC: ["claude-3-5-haiku-latest", "claude-3-7-sonnet-latest"],
  OPENROUTER: [
    "openrouter/free",
    "deepseek/deepseek-chat",
    "google/gemini-2.5-flash",
    "anthropic/claude-sonnet-4",
    "openai/gpt-4.1-mini",
  ],
};

function createDraft(provider: ProviderStatus): ProviderDraft {
  return {
    apiKey: "",
    model: provider.model,
    active: provider.active,
    autoImportReviewEnabled: provider.autoImportReviewEnabled,
    autoAcceptEnabled: provider.autoAcceptEnabled,
    minimumReadinessScore: provider.minimumReadinessScore,
    minimumConfidenceScore: provider.minimumConfidenceScore,
  };
}

function normalizeProviders(payload: unknown): ProviderStatus[] {
  if (Array.isArray(payload)) {
    return payload as ProviderStatus[];
  }

  if (payload && typeof payload === "object") {
    const object = payload as {
      providers?: unknown;
      data?: unknown;
    };

    if (Array.isArray(object.providers)) {
      return object.providers as ProviderStatus[];
    }

    if (Array.isArray(object.data)) {
      return object.data as ProviderStatus[];
    }
  }

  return [];
}

function getApiMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const object = payload as {
      message?: unknown;
      error?: unknown;
    };

    if (typeof object.message === "string") {
      return object.message;
    }

    if (typeof object.error === "string") {
      return object.error;
    }
  }

  return fallback;
}

export function AdminAiProviderManager() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);

  const [drafts, setDrafts] = useState<Record<string, ProviderDraft>>({});

  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/integrations/ai", {
        method: "GET",
        cache: "no-store",
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getApiMessage(payload, "AI sağlayıcıları alınamadı."));
      }

      const items = normalizeProviders(payload);

      setProviders(items);

      setDrafts(
        Object.fromEntries(
          items.map((provider) => [provider.provider, createDraft(provider)]),
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "AI sağlayıcıları alınamadı.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  function updateDraft(provider: string, patch: Partial<ProviderDraft>) {
    setDrafts((current) => {
      const existing = current[provider];

      if (!existing) {
        return current;
      }

      const updated: ProviderDraft = {
        apiKey: patch.apiKey ?? existing.apiKey,
        model: patch.model ?? existing.model,
        active: patch.active ?? existing.active,
        autoImportReviewEnabled:
          patch.autoImportReviewEnabled ?? existing.autoImportReviewEnabled,
        autoAcceptEnabled:
          patch.autoAcceptEnabled ?? existing.autoAcceptEnabled,
        minimumReadinessScore:
          patch.minimumReadinessScore ?? existing.minimumReadinessScore,
        minimumConfidenceScore:
          patch.minimumConfidenceScore ?? existing.minimumConfidenceScore,
      };

      return {
        ...current,
        [provider]: updated,
      };
    });
  }

  async function saveProvider(provider: ProviderStatus) {
    const draft = drafts[provider.provider];

    if (!draft) {
      return;
    }

    if (draft.apiKey.trim().length < 10) {
      setError(
        provider.configured
          ? "API anahtarını değiştirmek veya ayarları yeniden kaydetmek için anahtarı tekrar gir."
          : "Geçerli bir API anahtarı gir.",
      );
      return;
    }

    setBusyProvider(provider.provider);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/integrations/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: provider.provider,
          apiKey: draft.apiKey.trim(),
          model: draft.model.trim(),
          active: draft.active,
          autoImportReviewEnabled: draft.autoImportReviewEnabled,
          autoAcceptEnabled: draft.autoAcceptEnabled,
          minimumReadinessScore: draft.minimumReadinessScore,
          minimumConfidenceScore: draft.minimumConfidenceScore,
        }),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiMessage(payload, "AI sağlayıcısı kaydedilemedi."),
        );
      }

      setSuccess(getApiMessage(payload, `${provider.label} kaydedildi.`));

      await loadProviders();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "AI sağlayıcısı kaydedilemedi.",
      );
    } finally {
      setBusyProvider(null);
    }
  }

  async function testProvider(provider: ProviderStatus) {
    const draft = drafts[provider.provider];

    if (!draft) {
      return;
    }

    const useSavedCredential =
      provider.configured && draft.apiKey.trim().length === 0;

    if (!useSavedCredential && draft.apiKey.trim().length < 10) {
      setError("Bağlantıyı test etmek için API anahtarı gir.");
      return;
    }

    setBusyProvider(provider.provider);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/integrations/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          useSavedCredential
            ? {
                provider: provider.provider,
                useSavedCredential: true,
              }
            : {
                provider: provider.provider,
                apiKey: draft.apiKey.trim(),
                model: draft.model.trim(),
                useSavedCredential: false,
              },
        ),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getApiMessage(payload, "Bağlantı testi başarısız."));
      }

      setSuccess(
        getApiMessage(payload, `${provider.label} bağlantısı başarılı.`),
      );

      await loadProviders();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Bağlantı testi başarısız.",
      );
    } finally {
      setBusyProvider(null);
    }
  }

  async function removeProvider(provider: ProviderStatus) {
    if (!window.confirm(`${provider.label} bağlantısı kaldırılsın mı?`)) {
      return;
    }

    setBusyProvider(provider.provider);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/integrations/ai/${provider.provider}`,
        {
          method: "DELETE",
        },
      );

      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getApiMessage(payload, "Bağlantı kaldırılamadı."));
      }

      setSuccess(getApiMessage(payload, `${provider.label} kaldırıldı.`));

      await loadProviders();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Bağlantı kaldırılamadı.",
      );
    } finally {
      setBusyProvider(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border border-border bg-card">
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Intelligence
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Yapay zekâ sağlayıcıları
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          OpenAI, Gemini, Claude ve OpenRouter API bağlantılarını buradan yönet.
          API anahtarları istemciye gönderilmez ve veritabanında şifreli
          saklanır.
        </p>
      </header>

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <XCircle className="mt-0.5 size-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {providers.map((provider) => {
          const draft = drafts[provider.provider];

          if (!draft) {
            return null;
          }

          const busy = busyProvider === provider.provider;

          const models = suggestedModels[provider.provider] ?? [];

          return (
            <section
              key={provider.provider}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border p-6">
                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
                    <Bot className="size-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">{provider.label}</h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {provider.configured
                        ? `Kayıtlı anahtar: ${
                            provider.maskedApiKey ?? "şifrelenmiş"
                          }`
                        : "Henüz yapılandırılmadı"}
                    </p>
                  </div>
                </div>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    provider.active
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {provider.active ? "Aktif" : "Pasif"}
                </span>
              </div>

              <div className="space-y-5 p-6">
                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <KeyRound className="size-4" />
                    API anahtarı
                  </span>

                  <input
                    type="password"
                    value={draft.apiKey}
                    onChange={(event) =>
                      updateDraft(provider.provider, {
                        apiKey: event.target.value,
                      })
                    }
                    placeholder={
                      provider.configured
                        ? "Yeni anahtar girmediğin sürece kayıtlı anahtar korunur"
                        : provider.provider === "OPENROUTER"
                          ? "sk-or-v1-..."
                          : "API anahtarını gir"
                    }
                    autoComplete="new-password"
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Model</span>

                  <input
                    list={`models-${provider.provider}`}
                    value={draft.model}
                    onChange={(event) =>
                      updateDraft(provider.provider, {
                        model: event.target.value,
                      })
                    }
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <datalist id={`models-${provider.provider}`}>
                    {models.map((model) => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>

                  {provider.provider === "OPENROUTER" ? (
                    <p className="text-xs text-muted-foreground">
                      Ücretsiz başlangıç için <code>openrouter/free</code>{" "}
                      kullanabilirsin.
                    </p>
                  ) : null}
                </label>

                <label className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                  <span>
                    <span className="block text-sm font-medium">
                      Aktif sağlayıcı
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      Aktifleştirildiğinde diğer sağlayıcılar pasif hale gelir.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) =>
                      updateDraft(provider.provider, {
                        active: event.target.checked,
                      })
                    }
                    className="size-4"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                  <span>
                    <span className="block text-sm font-medium">
                      Otomatik import incelemesi
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      İçe aktarılan yayınları AI ile kontrol eder.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={draft.autoImportReviewEnabled}
                    onChange={(event) =>
                      updateDraft(provider.provider, {
                        autoImportReviewEnabled: event.target.checked,
                      })
                    }
                    className="size-4"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                  <span>
                    <span className="block text-sm font-medium">
                      Güvenli sonuçları otomatik kabul et
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      Belirlenen puanları geçen sonuçları otomatik onaylar.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={draft.autoAcceptEnabled}
                    onChange={(event) =>
                      updateDraft(provider.provider, {
                        autoAcceptEnabled: event.target.checked,
                      })
                    }
                    className="size-4"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">
                      Minimum hazırlık puanı
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.minimumReadinessScore}
                      onChange={(event) =>
                        updateDraft(provider.provider, {
                          minimumReadinessScore: Number(event.target.value),
                        })
                      }
                      className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">
                      Minimum güven puanı
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.minimumConfidenceScore}
                      onChange={(event) =>
                        updateDraft(provider.provider, {
                          minimumConfidenceScore: Number(event.target.value),
                        })
                      }
                      className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                    />
                  </label>
                </div>

                {provider.lastTestedAt ? (
                  <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs">
                    Son test:{" "}
                    {new Date(provider.lastTestedAt).toLocaleString("tr-TR")}
                  </div>
                ) : null}

                {provider.lastTestError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {provider.lastTestError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveProvider(provider)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Kaydet
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void testProvider(provider)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    <PlugZap className="size-4" />
                    Bağlantıyı test et
                  </button>

                  {provider.configured ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeProvider(provider)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 xl:ml-auto"
                    >
                      <Trash2 className="size-4" />
                      Kaldır
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
