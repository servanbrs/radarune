import { ExternalLink, Globe2, RefreshCw } from "lucide-react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import sitemap from "@/app/sitemap";
import { seoUrl } from "@/features/seo/server/seo-url";

export const dynamic = "force-dynamic";

export default async function AdminSitemapPage() {
  const entries = await sitemap();
  return <AdminShell title="Sitemap yönetimi" description="Arama motorlarının Radarune içeriğini keşfetmesi için oluşturulan sitemap kaydını izleyin.">
    <div className="grid gap-5">
      <section className="panel grid gap-5 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">SEO altyapısı</p><h2 className="mt-2 text-2xl font-semibold">Sitemap hazır ve canlı</h2><p className="mt-2 text-sm leading-7 text-muted">Yayınlanan sanatçı profilleri ve aktif smart link sayfaları otomatik olarak listeye eklenir.</p></div><Globe2 className="h-8 w-8 text-accent" /></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.15em] text-muted">Toplam URL</p><p className="mt-2 text-3xl font-semibold">{entries.length}</p></div><div className="rounded-xl border border-accent/30 bg-accent/10 p-4"><p className="text-xs uppercase tracking-[0.15em] text-muted">Durum</p><p className="mt-2 font-semibold text-accent">Aktif</p></div><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.15em] text-muted">Otomatik güncelleme</p><p className="mt-2 font-semibold">Açık</p></div></div><a className="w-fit rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-strong" href="/sitemap.xml" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 inline h-4 w-4" /> sitemap.xml dosyasını aç</a></section>
      <section className="panel overflow-hidden p-0"><div className="flex items-center justify-between border-b border-line p-6"><div><h2 className="text-lg font-semibold">URL önizlemesi</h2><p className="mt-1 text-sm text-muted">Son oluşturulan sitemap içeriği.</p></div><RefreshCw className="h-5 w-5 text-muted" /></div><div className="divide-y divide-line">{entries.map((entry) => <a className="flex items-center justify-between gap-4 px-6 py-4 text-sm hover:bg-surface-strong" href={entry.url} key={entry.url} target="_blank" rel="noreferrer"><span className="truncate">{entry.url}</span><span className="shrink-0 text-xs text-muted">{entry.priority ? `Öncelik ${entry.priority}` : ""}</span></a>)}</div>{entries.length === 0 && <p className="p-6 text-sm text-muted">Henüz yayınlanabilir URL bulunamadı.</p>}</section>
      <p className="text-xs leading-6 text-muted">Sitemap adresi: <a className="text-accent hover:underline" href={seoUrl("/sitemap.xml")} target="_blank" rel="noreferrer">{seoUrl("/sitemap.xml")}</a></p>
    </div>
  </AdminShell>;
}
