"use client";

import { useState } from "react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    const form = event.currentTarget;
    const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    if (response.ok) { setSent(true); form.reset(); } else setError((await response.json().catch(() => null))?.error ?? "Mesaj gönderilemedi.");
    setPending(false);
  }
  return <><PublicHeader /><main className="page-shell pb-24"><div className="grid w-full gap-6 lg:grid-cols-[.85fr_1.15fr]"><section className="panel overflow-hidden bg-[#111d20] p-8 text-white md:p-12"><p className="text-xs uppercase tracking-[.28em] text-[#44c7ad]">Radarune destek merkezi</p><h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">Birlikte çözelim.</h1><p className="mt-6 max-w-lg text-base leading-8 text-white/65">Telif, dağıtım, ödeme veya hesabınızla ilgili sorularınızı doğru ekibe ulaştıralım.</p><div className="mt-12 grid gap-3 text-sm text-white/70"><span>✦ Teknik destek ve hesap yardımı</span><span>✦ Telif ve içerik bildirimleri</span><span>✦ İş ortaklığı ve basın talepleri</span></div><div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">Ortalama yanıt süresi: <strong className="text-white">1 iş günü</strong></div></section><section className="panel p-6 md:p-10"><p className="text-xs uppercase tracking-[.25em] text-accent">Bize ulaşın</p><h2 className="mt-3 text-3xl font-semibold">İletişim formu</h2><p className="mt-3 text-sm leading-6 text-muted">Mesajınız ilgili admin ve moderatör ekibine bildirim olarak iletilir.</p>{sent ? <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-accent"><p className="font-semibold">Mesajınız alındı.</p><p className="mt-1 text-sm">Ekibimiz en kısa sürede sizinle iletişime geçecek.</p><button className="mt-4 rounded-full border border-accent/30 px-4 py-2 text-sm font-semibold" onClick={() => setSent(false)} type="button">Yeni mesaj gönder</button></div> : <form className="mt-7 grid gap-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><input className="rounded-2xl border border-line bg-background px-4 py-3" name="name" placeholder="Ad soyad" required /><input className="rounded-2xl border border-line bg-background px-4 py-3" name="email" placeholder="E-posta adresi" required type="email" /></div><select className="rounded-2xl border border-line bg-background px-4 py-3" defaultValue="" name="subject" required><option disabled value="">Başvuru türünü seçin</option><option value="Teknik destek">Teknik destek</option><option value="Telif bildirimi">Telif bildirimi</option><option value="Dağıtım ve yayın">Dağıtım ve yayın</option><option value="İş ortaklığı">İş ortaklığı</option></select><textarea className="min-h-44 rounded-2xl border border-line bg-background px-4 py-3" minLength={10} name="message" placeholder="Nasıl yardımcı olabiliriz?" required /><button className="rounded-2xl bg-accent px-5 py-3.5 font-semibold text-accent-foreground disabled:opacity-50" disabled={pending} type="submit">{pending ? "Gönderiliyor…" : "Başvuruyu gönder →"}</button>{error ? <p className="text-sm text-danger">{error}</p> : null}</form>}</section></div></main><PublicFooter /></>;
}
