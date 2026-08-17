"use client";
/* eslint-disable @next/next/no-img-element -- Share cards accept runtime/provider artwork URLs. */

import { useMemo, useState } from "react";
import { Check, Clock3, Send, Sparkles, X } from "lucide-react";
import type { WeeklyShareCandidate, WeeklyShareCardDto } from "@/features/admin/server/services/weekly-share-card.service";

type Props = { candidates: WeeklyShareCandidate[]; card: WeeklyShareCardDto | null };

function statusLabel(status?: string) {
  return status === "PENDING_REVIEW" ? "Onay bekliyor" : status === "APPROVED" ? "Onaylandı" : status === "REJECTED" ? "Revizyon istendi" : "Taslak";
}

export function WeeklyShareCardBuilder({ candidates, card }: Props) {
  const [selected, setSelected] = useState<string[]>(card?.items.map((item) => item.releaseId) ?? []);
  const [title, setTitle] = useState(card?.title ?? "Radarune haftanın ilk 5 yayını");
  const [subtitle, setSubtitle] = useState(card?.subtitle ?? "Bu haftanın en çok etkileşim alan yayınları");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedItems = useMemo(() => selected.map((id) => candidates.find((candidate) => candidate.releaseId === id)).filter(Boolean) as WeeklyShareCandidate[], [candidates, selected]);
  const locked = card?.status === "APPROVED";

  function toggle(id: string) {
    setError(null);
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length >= 5 ? current : [...current, id]);
  }

  async function save(submit: boolean) {
    setError(null); setMessage(null);
    const response = await fetch("/api/admin/growth/weekly-picks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ releaseIds: selected, title, subtitle, submit }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) return setError(data.error ?? "Kart kaydedilemedi.");
    setMessage(submit ? "Kart admin onayına gönderildi." : "Kart taslağı kaydedildi.");
    window.location.reload();
  }

  async function review(decision: "APPROVED" | "REJECTED") {
    if (!card) return;
    setError(null); setMessage(null);
    const response = await fetch("/api/admin/growth/weekly-picks/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cardId: card.id, decision, note }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) return setError(data.error ?? "Kart kararı kaydedilemedi.");
    window.location.reload();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)]">
      <section className="rounded-[28px] border border-white/10 bg-[#151c30] p-5 shadow-2xl sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d6a85f]">Haftalık editoryal seçim</p><h2 className="mt-2 text-2xl font-semibold">İlk 5 yayını seç</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#b7c2d0]">Etki puanı ve oy sinyaline göre sıralanan yayınlardan bu haftanın paylaşım kartını hazırla.</p></div>
          {card ? <span className="inline-flex items-center gap-2 rounded-full border border-[#d6a85f]/30 bg-[#d6a85f]/10 px-3 py-2 text-xs font-semibold text-[#f1c77f]"><Clock3 className="size-3.5" /> {statusLabel(card.status)}</span> : null}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-white/70">Kart başlığı<input value={title} disabled={locked} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0e1527] px-3 py-3 text-sm text-white outline-none focus:border-[#d6a85f]" /></label>
          <label className="text-xs font-semibold text-white/70">Alt başlık<input value={subtitle} disabled={locked} onChange={(event) => setSubtitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0e1527] px-3 py-3 text-sm text-white outline-none focus:border-[#d6a85f]" /></label>
        </div>
        <div className="mt-6 grid gap-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Uygun yayınlar</h3><span className="text-xs text-white/45">{selected.length}/5 seçili</span></div>
          {candidates.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#0e1527] p-5 text-sm text-white/55">Paylaşım için uygun yayın bulunamadı.</div> : candidates.map((candidate) => {
            const isSelected = selected.includes(candidate.releaseId);
            return <button type="button" key={candidate.releaseId} disabled={locked} onClick={() => toggle(candidate.releaseId)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${isSelected ? "border-[#d6a85f] bg-[#d6a85f]/10" : "border-white/10 bg-[#0e1527] hover:border-white/25"}`}>
              <img src={candidate.artworkUrl} alt="" className="size-14 rounded-xl object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{candidate.title}</span><span className="mt-1 block truncate text-xs text-white/55">{candidate.artistName} · {candidate.genre}</span></span><span className={`flex size-7 items-center justify-center rounded-full ${isSelected ? "bg-[#d6a85f] text-[#17120b]" : "border border-white/15 text-transparent"}`}><Check className="size-4" /></span>
            </button>;
          })}
        </div>
        {message ? <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        {!locked ? <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => save(false)} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/[0.06]">Taslak kaydet</button><button type="button" onClick={() => save(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#d6a85f] px-4 py-3 text-sm font-bold text-[#17120b] hover:bg-[#e5bd7b]"><Send className="size-4" /> Onaya gönder</button></div> : null}
        {card?.status === "PENDING_REVIEW" ? <div className="mt-6 rounded-2xl border border-[#d6a85f]/25 bg-[#d6a85f]/[0.06] p-4"><label className="text-xs font-semibold text-white/70">Admin notu<textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-[#0e1527] p-3 text-sm text-white outline-none" placeholder="Revizyon notu (isteğe bağlı)" /></label><div className="mt-3 flex gap-3"><button type="button" onClick={() => review("REJECTED")} className="inline-flex items-center gap-2 rounded-xl border border-red-300/25 px-4 py-2.5 text-sm font-semibold text-red-200"><X className="size-4" /> Revizyon iste</button><button type="button" onClick={() => review("APPROVED")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-bold text-[#0e241d]"><Check className="size-4" /> Onayla</button></div></div> : null}
      </section>
      <section className="rounded-[28px] border border-[#d6a85f]/25 bg-[#111a24] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f1c77f]"><Sparkles className="size-4" /> Kart önizlemesi</div>
        <div className="mt-5 overflow-hidden rounded-[26px] bg-[#0b111b] p-4 shadow-xl"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d6a85f]">Radarune haftanın seçkisi</p><h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3><p className="mt-1 text-sm text-white/50">{subtitle}</p><div className="mt-5 grid gap-3">{selectedItems.length ? selectedItems.map((item, index) => <div key={item.releaseId} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5"><span className="w-5 text-center text-xs font-bold text-[#f1c77f]">{index + 1}</span><img src={item.artworkUrl} alt="" className="size-12 rounded-xl object-cover" /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="block truncate text-xs text-white/50">{item.artistName}</span></span></div>) : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">Önizlemek için yayın seç.</div>}</div><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/40"><span>Radarune · Bu hafta</span><span>{selectedItems.length}/5 yayın</span></div></div>
      </section>
    </div>
  );
}
