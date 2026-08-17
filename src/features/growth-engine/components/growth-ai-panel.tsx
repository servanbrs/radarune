"use client";

import { useState } from "react";

type Action = { actionKey: string; title: string; channel: string; priority: string; reason: string; nextStep: string; targetUrl: string; canApply: boolean };
type Plan = { summary: string; source: string; metrics: Record<string, number>; actions: Action[] };

const metricLabels: Record<string, string> = { newUsers: "Yeni kullanıcı", artists: "Sanatçı", releases: "Yayın", pendingApplications: "Bekleyen başvuru", releaseVotes: "Yayın oyu", artistFollows: "Sanatçı takibi", smartLinkViews: "Smart Link görüntülenme", smartLinkClicks: "Smart Link tıklama" };

export function GrowthAiPanel() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  async function createPlan() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/growth/assistant", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Büyüme planı oluşturulamadı.");
      setPlan(data as Plan);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Büyüme planı oluşturulamadı."); } finally { setLoading(false); }
  }
  async function applyAction(action: Action) {
    setApplying(action.actionKey); setError("");
    try {
      const response = await fetch("/api/admin/growth/assistant/apply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ actionKey: action.actionKey }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Büyüme görevi uygulanamadı.");
      if (!data.applied && data.targetUrl) {
        window.location.assign(data.targetUrl);
        return;
      }
      setApplied((current) => ({ ...current, [action.actionKey]: data.message ?? "Görev uygulandı." }));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Büyüme görevi uygulanamadı."); } finally { setApplying(null); }
  }
  return <section className="panel grid gap-5 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">AI büyüme yardımcısı</p><h2 className="mt-2 text-2xl font-semibold">Gerçek kullanıcı kazanım planı</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Son 30 günlük gerçek veriyi ve haftalık rotasyonu analiz eder; aynı öneri listesini tekrarlamak yerine fırsata göre farklı görevler üretir.</p></div><button className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={loading} onClick={() => void createPlan()} type="button">{loading ? "Analiz ediliyor…" : "Yeni plan oluştur"}</button></div>{error ? <p className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</p> : null}{plan ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(plan.metrics).filter(([key]) => key !== "periodDays").map(([key, value]) => <div className="rounded-2xl border border-line bg-surface-strong p-4" key={key}><p className="text-xs text-muted">{metricLabels[key] ?? key}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div><div className="rounded-2xl border border-accent/25 bg-accent/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Özet · {plan.source}</p><p className="mt-2 text-sm leading-6">{plan.summary}</p></div><div className="grid gap-3">{plan.actions.map((action, index) => <article className="rounded-2xl border border-line bg-surface-strong p-4" key={`${action.actionKey}-${index}`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{action.title}</h3><span className="rounded-full border border-accent/30 px-2.5 py-1 text-xs font-semibold text-accent">{action.priority}</span></div><p className="mt-1 text-xs font-semibold text-muted">{action.channel}</p><p className="mt-3 text-sm text-muted">{action.reason}</p><p className="mt-3 rounded-xl bg-background/60 p-3 text-sm"><strong>Sonraki iş:</strong> {action.nextStep}</p>{applied[action.actionKey] ? <p className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{applied[action.actionKey]}</p> : <button className="mt-4 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50" disabled={applying === action.actionKey} onClick={() => void applyAction(action)} type="button">{applying === action.actionKey ? "Uygulanıyor…" : action.canApply ? "Onayla ve uygula" : "Sistemde aç ve uygula"}</button>}</article>)}</div></> : <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">Plan oluşturulduğunda gerçek metrikler ve doğrudan uygulanabilir görevler burada görünecek.</div>}</section>;
}
