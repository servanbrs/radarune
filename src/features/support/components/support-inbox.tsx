"use client";

import { useCallback, useEffect, useState } from "react";

type Ticket = { id: string; subject: string; status: string; priority: string; referenceIsrc: string | null; referenceUpc: string | null; lastMessageAt: string; _count: { messages: number }; requester?: { id?: string; name: string; email: string }; organization?: { id: string; name: string; slug: string } };
type Thread = Ticket & { messages: Array<{ id: string; content: string; internal: boolean; createdAt: string; sender: { name: string; systemRole: string } | null }> };
type StaffPresence = { id: string; name: string; role: string; active: boolean };

function ticketNumber(id: string) {
  return `RDR-${id.slice(-8).toUpperCase()}`;
}

function ticketCategory(subject: string) {
  const value = subject.toLocaleLowerCase("tr-TR");
  if (/yayın|şarkı|isrc|upc|dağıt/.test(value)) return "Yayın ve dağıtım";
  if (/sanatçı|profil|spotify|apple/.test(value)) return "Sanatçı profili";
  if (/ödeme|gelir|royalt/.test(value)) return "Ödeme ve gelir";
  if (/giriş|şifre|hesap|mail|e-posta/.test(value)) return "Hesap ve giriş";
  return "Genel destek";
}

function roleLabel(role?: string | null) {
  if (role === "MODERATOR") return "Moderatör";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "Admin";
  return "Kullanıcı";
}

export function SupportInbox({ admin = false }: { admin?: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isrc, setIsrc] = useState("");
  const [upc, setUpc] = useState("");
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffPresence[]>([]);

  const loadTickets = useCallback(async () => {
    const response = await fetch("/api/support/tickets", { cache: "no-store" });
    if (response.ok) setTickets((await response.json()) as Ticket[]);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const response = await fetch(`/api/support/tickets/${id}`, { cache: "no-store" });
    if (response.ok) setSelected((await response.json()) as Thread);
  }, []);

  const loadPresence = useCallback(async () => {
    const response = await fetch("/api/support/presence", { cache: "no-store" });
    if (response.ok) setStaff((await response.json()) as StaffPresence[]);
  }, []);

  useEffect(() => {
    // Polling intentionally synchronizes this client with the support API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTickets();
    void loadPresence();
  }, [loadPresence, loadTickets]);
  useEffect(() => {
    const timer = window.setInterval(() => { void loadTickets(); void loadPresence(); if (selected) void loadThread(selected.id); }, 5000);
    return () => window.clearInterval(timer);
  }, [loadPresence, loadTickets, loadThread, selected]);

  async function createTicket() {
    setError(null);
    const response = await fetch("/api/support/tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject, message, isrc: isrc || undefined, upc: upc || undefined }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(data?.error ?? "Destek talebi oluşturulamadı."); return; }
    setSubject(""); setMessage(""); setIsrc(""); setUpc(""); await loadTickets();
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    const response = await fetch(`/api/support/tickets/${selected.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: reply, internal }) });
    if (!response.ok) { setError("Mesaj gönderilemedi."); return; }
    setReply(""); await loadThread(selected.id); await loadTickets();
  }

  const activeStaff = staff.filter((member) => member.active);
  const supportSenderLabel = (sender: Thread["messages"][number]["sender"]) => {
    if (!sender) return "Sistem";
    if (!admin && ["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(sender.systemRole)) return "Destek ekibi aktif";
    return `${sender.name} · ${roleLabel(sender.systemRole)}`;
  };

  return <div className="space-y-5">
    <section className="panel flex flex-wrap items-center justify-between gap-3 p-4">
      <div><p className="text-sm font-semibold">Destek ekibi</p><p className="mt-1 text-xs text-muted">Aktif ekip üyeleri cevap verebilir.</p></div>
      <div className="flex flex-wrap gap-2">{activeStaff.length ? (admin ? activeStaff.map((member) => <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-strong px-3 py-1.5 text-xs" key={member.id}><span className="h-2 w-2 rounded-full bg-emerald-400" />{member.name} · {roleLabel(member.role)}</span>) : <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-strong px-3 py-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-emerald-400" />Destek ekibi aktif</span>) : <span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">Şu anda çevrimiçi ekip üyesi yok.</span>}</div>
    </section>
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
    <section className="panel p-5">
      <h2 className="text-lg font-semibold">{admin ? "Destek kuyruğu" : "Destek taleplerim"}</h2>
      <div className="mt-4 space-y-2">{tickets.length ? tickets.map((ticket) => <button className={`w-full rounded-2xl border p-3 text-left ${selected?.id === ticket.id ? "border-accent bg-accent/10" : "border-line bg-surface-strong"}`} key={ticket.id} onClick={() => void loadThread(ticket.id)} type="button"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-accent">{ticketNumber(ticket.id)}</p><p className="text-[10px] text-muted">{ticketCategory(ticket.subject)}</p></div><p className="mt-1 truncate text-sm font-semibold">{ticket.subject}</p><p className="mt-1 text-xs text-muted">{ticket.status} · {ticket._count.messages} mesaj</p>{admin && ticket.requester ? <p className="mt-1 truncate text-xs text-muted">{ticket.requester.name} · {ticket.requester.email}</p> : null}</button>) : <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Henüz destek talebi yok.</p>}</div>
    </section>
    <section className="panel min-h-[520px] p-5">
      {selected ? <><div className="border-b border-line pb-4"><h2 className="text-xl font-semibold">{selected.subject}</h2><p className="mt-2 text-sm font-semibold">{selected.requester?.name ?? "Bilinmeyen kullanıcı"}</p><p className="text-xs text-muted">{selected.requester?.email ?? "E-posta bilgisi yok"}{selected.organization ? ` · ${selected.organization.name}` : ""}</p><p className="mt-2 text-xs text-muted">{selected.referenceIsrc ? `ISRC: ${selected.referenceIsrc}` : ""} {selected.referenceUpc ? `UPC: ${selected.referenceUpc}` : ""}</p></div><div className="max-h-[360px] space-y-3 overflow-y-auto py-5">{selected.messages.map((item) => <div className={`rounded-2xl p-3 text-sm ${item.internal ? "border border-amber-300/40 bg-amber-50" : "bg-surface-strong"}`} key={item.id}><p className="whitespace-pre-wrap">{item.content}</p><p className="mt-2 text-[11px] text-muted">{supportSenderLabel(item.sender)} · {new Date(item.createdAt).toLocaleString("tr-TR")}{item.internal ? " · İç not" : ""}</p></div>)}</div><div className="border-t border-line pt-4"><textarea className="min-h-24 w-full rounded-xl border border-line bg-surface-strong p-3 text-sm" onChange={(event) => setReply(event.target.value)} placeholder="Yanıtınızı yazın…" value={reply} />{admin ? <label className="mt-2 flex items-center gap-2 text-xs text-muted"><input checked={internal} onChange={(event) => setInternal(event.target.checked)} type="checkbox" /> Yalnızca ekip içi not</label> : null}<button className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" onClick={() => void sendReply()} type="button">Gönder</button></div></> : <div className="grid min-h-[480px] place-items-center text-center text-sm text-muted">Bir destek talebi seçin veya yeni talep oluşturun.</div>}
      {!admin ? <div className="mt-6 border-t border-line pt-5"><h3 className="font-semibold">Yeni destek talebi</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm sm:col-span-2" onChange={(event) => setSubject(event.target.value)} placeholder="Konu" value={subject} /><input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setIsrc(event.target.value)} placeholder="ISRC (opsiyonel)" value={isrc} /><input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setUpc(event.target.value)} placeholder="UPC (opsiyonel)" value={upc} /><textarea className="min-h-24 rounded-xl border border-line bg-surface-strong p-3 text-sm sm:col-span-2" onChange={(event) => setMessage(event.target.value)} placeholder="Mesaj" value={message} /></div><button className="mt-3 rounded-xl border border-line px-4 py-2 text-sm font-semibold" onClick={() => void createTicket()} type="button">Talep oluştur</button></div> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
    </div>
  </div>;
}
