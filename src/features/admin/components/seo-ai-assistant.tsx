"use client";
import { useState } from "react";

export function SeoAiAssistant() {
  const [input, setInput] = useState({ title: "", description: "", keywords: "" });
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setLoading(true); setError("");
    try { const response = await fetch("/api/admin/seo/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "SEO önerisi alınamadı."); setResult(data); } catch (e) { setError(e instanceof Error ? e.message : "SEO önerisi alınamadı."); } finally { setLoading(false); }
  }
  return <section className="panel grid gap-4 p-6"><div><h2 className="text-lg font-semibold">AI SEO uyumluluk yardımcısı</h2><p className="mt-1 text-sm text-muted">Başlık, açıklama veya anahtar kelimelerinizi girin; AI öneri üretsin. OpenAI anahtarı yoksa dahili güvenli öneri kullanılır.</p></div><div className="grid gap-3 md:grid-cols-3"><input className="rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder="Mevcut başlık" value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} /><input className="rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder="Mevcut açıklama" value={input.description} onChange={(e) => setInput({ ...input, description: e.target.value })} /><input className="rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder="Anahtar kelimeler" value={input.keywords} onChange={(e) => setInput({ ...input, keywords: e.target.value })} /></div><button type="button" onClick={run} disabled={loading} className="w-fit rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground">{loading ? "Öneri hazırlanıyor…" : "SEO önerisi oluştur"}</button>{error && <p className="rounded-xl border border-danger/30 p-3 text-sm text-danger">{error}</p>}{result && <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm"><p><strong>Başlık:</strong> {result.title}</p><p><strong>Açıklama:</strong> {result.description}</p><p><strong>Anahtar kelimeler:</strong> {result.keywords}</p><p className="text-xs text-muted">Kaynak: {result.source}</p></div>}</section>;
}
