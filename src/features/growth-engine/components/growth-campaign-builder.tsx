"use client";

import { useMemo, useState } from "react";

const sources = ["instagram", "facebook", "youtube", "spotify", "google", "x"];

export function GrowthCampaignBuilder() {
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("social");
  const [campaign, setCampaign] = useState("haftanin-yayini");
  const [content, setContent] = useState("simdi-dinle");
  const [copied, setCopied] = useState(false);

  const campaignUrl = useMemo(() => {
    if (!url.trim()) return "";
    try {
      const target = new URL(url.trim(), window.location.origin);
      target.searchParams.set("utm_source", source);
      target.searchParams.set("utm_medium", medium);
      target.searchParams.set("utm_campaign", campaign);
      target.searchParams.set("utm_content", content);
      return target.toString();
    } catch {
      return "";
    }
  }, [campaign, content, medium, source, url]);

  async function copyUrl() {
    if (!campaignUrl) return;
    await navigator.clipboard.writeText(campaignUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="panel grid gap-5 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ölçülebilir büyüme</p>
        <h2 className="mt-2 text-2xl font-semibold">Kampanya bağlantısı oluştur</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Her paylaşım için ayrı bir UTM bağlantısı üretin. Böylece hangi kanalın Smart Link tıklaması getirdiğini
          görür, reklam bütçesini tahmine göre değil gerçek veriye göre yönetirsiniz.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Smart Link veya paylaşılacak sayfa adresi
          <input className="input" onChange={(event) => setUrl(event.target.value)} placeholder="https://radarune.com/l/sanatci-sarki" value={url} />
          <span className="text-xs font-normal text-muted">Admin panelindeki Smart Link sayfasından kopyaladığınız adresi yapıştırın.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Kaynak
          <select className="input" onChange={(event) => setSource(event.target.value)} value={source}>
            {sources.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Kanal türü
          <input className="input" onChange={(event) => setMedium(event.target.value)} value={medium} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Kampanya adı
          <input className="input" onChange={(event) => setCampaign(event.target.value)} value={campaign} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          İçerik / buton
          <input className="input" onChange={(event) => setContent(event.target.value)} value={content} />
        </label>
      </div>

      <div className="grid gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Hazır bağlantı</p>
        <p className="break-all text-sm leading-6 text-muted">{campaignUrl || "Adres girince ölçümlenebilir bağlantı burada görünecek."}</p>
        <div>
          <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50" disabled={!campaignUrl} onClick={() => void copyUrl()} type="button">
            {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
          </button>
        </div>
      </div>
    </section>
  );
}
