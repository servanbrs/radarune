import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";
import { updateSeoSettingsAction } from "@/features/admin/server/actions/admin-settings.actions";
import { seoBaseUrl } from "@/features/seo/server/seo-url";
import { SeoAiAssistant } from "@/features/admin/components/seo-ai-assistant";

export default async function AdminSeoPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const settings = await adminSystemService.listSettings(actor);
  const value = (key: string, fallback = "") => {
    const found = settings.find((item) => item.key === key)?.value;
    return typeof found === "string" ? found : fallback;
  };

  return <AdminShell title="SEO yönetimi" description="Arama motoru başlığını, açıklamasını ve teknik görünürlük ayarlarını tek merkezden yönetin.">
    <SeoAiAssistant />
    <form action={updateSeoSettingsAction} className="grid gap-5">
      <section className="panel grid gap-5 p-6">
        <div><h2 className="text-lg font-semibold">Arama görünümü</h2><p className="mt-1 text-sm text-muted">Google ve sosyal paylaşım önizlemelerinde kullanılacak temel metinleri düzenleyin.</p></div>
        <label className="text-sm font-medium">Sayfa başlığı<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3 outline-none focus:border-accent" name="seoTitle" defaultValue={value("SEO_TITLE", "Radarune | Müzik operasyon platformu")} maxLength={70} required /><span className="mt-1 block text-xs text-muted">Önerilen uzunluk: 50–60 karakter.</span></label>
        <label className="text-sm font-medium">Meta açıklaması<textarea className="mt-2 min-h-28 w-full rounded-xl border border-line bg-surface-strong px-4 py-3 outline-none focus:border-accent" name="seoDescription" defaultValue={value("SEO_DESCRIPTION", "Sanatçılar ve müzikseverler için ücretsiz keşif ve yayın platformu.")} maxLength={160} required /><span className="mt-1 block text-xs text-muted">Önerilen uzunluk: 140–160 karakter.</span></label>
        <label className="text-sm font-medium">Google Search Console doğrulama kodu<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3 outline-none focus:border-accent" name="googleSiteVerification" defaultValue={value("SEO_GOOGLE_SITE_VERIFICATION")} placeholder="Google’ın verdiği meta token" /></label>
        <label className="flex items-center gap-3 rounded-xl border border-line bg-surface-strong p-4 text-sm font-medium"><input type="checkbox" name="indexingEnabled" defaultChecked={value("SEO_INDEXING_ENABLED", "true") !== "false"} /> Herkese açık sayfaları arama motorlarına aç</label>
        <label className="text-sm font-medium">Değişiklik sebebi<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3 outline-none focus:border-accent" name="reason" placeholder="SEO metinlerini güncelledim" minLength={10} required /></label>
        <button className="w-fit rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground" type="submit">SEO ayarlarını kaydet</button>
      </section>
      <section className="panel grid gap-4 p-6"><div><h2 className="text-lg font-semibold">Google ve teknik görünürlük</h2><p className="mt-1 text-sm text-muted">Search Console’da mülkünüzü ekleyin, aşağıdaki doğrulama kodunu buraya yapıştırın ve sitemap adresini gönderin.</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.15em] text-muted">Canonical temel URL</p><p className="mt-2 break-all text-sm font-semibold">{seoBaseUrl()}</p></div><div className="rounded-xl border border-accent/30 bg-accent/10 p-4"><p className="text-xs uppercase tracking-[0.15em] text-muted">Sitemap</p><p className="mt-2 font-semibold text-accent">Aktif</p></div><div className="rounded-xl border border-accent/30 bg-accent/10 p-4"><p className="text-xs uppercase tracking-[0.15em] text-muted">Robots</p><p className="mt-2 font-semibold text-accent">Aktif</p></div></div><div className="flex flex-wrap gap-3"><a className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Google Search Console’u aç ↗</a><a className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-strong" href="/sitemap.xml" target="_blank" rel="noreferrer">sitemap.xml’i görüntüle</a></div></section>
    </form>
  </AdminShell>;
}
