"use client";

import {
  Bot,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  provider?: string;
  model?: string;
};

type GenerateResponse = {
  success: boolean;
  text?: string;
  message?: string;
  status?: string;
  configuration?: {
    provider: string;
    model: string;
  } | null;
};

const QUICK_PROMPTS = [
  {
    title: "Spotify pitch",
    prompt:
      "Yeni çıkan duygusal bir pop şarkısı için 500 karakteri geçmeyen profesyonel bir Spotify pitch yaz.",
  },
  {
    title: "Metadata kontrolü",
    prompt:
      "Bir single yayınının dağıtıma hazır olması için ayrıntılı metadata kontrol listesi oluştur.",
  },
  {
    title: "Sanatçı biyografisi",
    prompt:
      "Yeni bir alternatif pop sanatçısı için kısa ve profesyonel sanatçı biyografisi yaz.",
  },
  {
    title: "Yayın duyurusu",
    prompt:
      "Yeni single yayını için profesyonel Instagram gönderi açıklaması hazırla.",
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getProviderLabel(provider?: string) {
  switch (provider) {
    case "OPENAI":
      return "OpenAI";
    case "GOOGLE_GEMINI":
      return "Google Gemini";
    case "ANTHROPIC":
      return "Anthropic Claude";
    case "OPENROUTER":
      return "OpenRouter";
    default:
      return provider ?? "AI";
  }
}

export function AdminAiChatPanel() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeConfiguration = useMemo(
    () =>
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "ASSISTANT" && Boolean(message.provider),
        ),
    [messages],
  );

  async function sendMessage(customPrompt?: string) {
    const text = (customPrompt ?? prompt).trim();

    if (!text || loading) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "USER",
        content: text,
      },
    ]);

    setPrompt("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/integrations/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          temperature: 0.4,
          maxOutputTokens: 1200,
        }),
      });

      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "AI isteği tamamlanamadı.");
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "ASSISTANT",
        content: payload.text ?? "AI boş cevap döndürdü.",
        ...(payload.configuration?.provider
          ? {
              provider: payload.configuration.provider,
            }
          : {}),
        ...(payload.configuration?.model
          ? {
              model: payload.configuration.model,
            }
          : {}),
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "AI isteği gönderilemedi.";

      setError(message);
    } finally {
      setLoading(false);

      window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  async function copyMessage(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);

      setCopiedId(message.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      setError("Yanıt panoya kopyalanamadı.");
    }
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-5 border-b border-border p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="size-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">AI Chat</h2>

              {activeConfiguration ? (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                  {getProviderLabel(activeConfiguration.provider)}
                  {" · "}
                  {activeConfiguration.model}
                </span>
              ) : (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Aktif provider kullanılır
                </span>
              )}
            </div>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Kaydettiğin aktif API bağlantısını gerçek mesajlarla burada test
              et.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setPrompt("");
            setError(null);
          }}
          disabled={loading || messages.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          <RotateCcw className="size-4" />
          Sohbeti temizle
        </button>
      </div>

      <div className="grid min-h-[620px] xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="flex min-h-0 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="flex size-16 items-center justify-center rounded-3xl bg-muted">
                  <MessageSquareText className="size-8 text-muted-foreground" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  AI bağlantısını deneyelim
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Bir mesaj yaz veya hazır testlerden birini seç. Sistem, aktif
                  olarak kaydettiğin sağlayıcıyı kullanır.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={[
                    "flex items-start gap-3",
                    message.role === "USER" ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  {message.role === "ASSISTANT" ? (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Bot className="size-4" />
                    </div>
                  ) : null}

                  <div
                    className={[
                      "max-w-[85%] rounded-2xl p-4 text-sm leading-7",
                      message.role === "USER"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border bg-background",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>

                    {message.role === "ASSISTANT" ? (
                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                        {message.provider ? (
                          <span>{getProviderLabel(message.provider)}</span>
                        ) : null}

                        {message.model ? <span>{message.model}</span> : null}

                        <button
                          type="button"
                          onClick={() => void copyMessage(message)}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-muted"
                        >
                          {copiedId === message.id ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}

                          {copiedId === message.id ? "Kopyalandı" : "Kopyala"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {message.role === "USER" ? (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <UserRound className="size-4" />
                    </div>
                  ) : null}
                </article>
              ))
            )}

            {loading ? (
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>

                <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  AI cevap hazırlıyor…
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mx-5 mb-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:mx-6">
              <XCircle className="mt-0.5 size-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="border-t border-border p-4 sm:p-5">
            <div className="rounded-2xl border border-input bg-background p-3 focus-within:ring-2 focus-within:ring-ring">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={4}
                placeholder="AI'ya bir mesaj yaz…"
                className="w-full resize-none bg-transparent px-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Enter gönderir · Shift + Enter yeni satır
                </p>

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={loading || prompt.trim().length < 2}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="border-t border-border bg-muted/20 p-5 xl:border-l xl:border-t-0">
          <h3 className="text-sm font-semibold">Hızlı testler</h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            API bağlantısını test etmek için örnek seç.
          </p>

          <div className="mt-5 grid gap-3">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.title}
                type="button"
                disabled={loading}
                onClick={() => void sendMessage(item.prompt)}
                className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-muted disabled:opacity-50"
              >
                <span className="block text-sm font-medium">{item.title}</span>

                <span className="mt-1 line-clamp-3 block text-xs leading-5 text-muted-foreground">
                  {item.prompt}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
