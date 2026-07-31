"use client";

import { Bot, MessageSquareText, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";

import { AdminAiChatPanel } from "@/features/ai-provider/components/admin-ai-chat-panel";
import { AdminAiProviderManager } from "@/features/ai-provider/components/admin-ai-provider-manager";

type ActiveTab = "PROVIDERS" | "CHAT";

export function AdminAiProviderConsole() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("CHAT");

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-[30px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-7" />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Radarune Intelligence
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                AI Yönetim Merkezi
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Yapay zekâ sağlayıcılarını bağla, aktif modeli yönet ve API
                bağlantısını aynı ekrandaki AI Chat ile gerçek zamanlı test et.
              </p>
            </div>
          </div>

          <div className="grid min-w-[320px] grid-cols-2 rounded-2xl border border-border bg-muted/40 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("PROVIDERS")}
              className={[
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                activeTab === "PROVIDERS"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Settings2 className="size-4" />
              Sağlayıcılar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("CHAT")}
              className={[
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                activeTab === "CHAT"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <MessageSquareText className="size-4" />
              AI Chat
            </button>
          </div>
        </div>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <Bot className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Provider yönetimi</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              API anahtarı, model ve otomasyon ayarları.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <MessageSquareText className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Canlı AI testi</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Aktif sağlayıcıyla gerçek cevap üret.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <Sparkles className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Radarune asistanı</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Metadata, pitch ve yayın kontrolleri.
            </p>
          </div>
        </div>
      </header>

      {activeTab === "PROVIDERS" ? (
        <AdminAiProviderManager />
      ) : (
        <AdminAiChatPanel />
      )}
    </div>
  );
}
