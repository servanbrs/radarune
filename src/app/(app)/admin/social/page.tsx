import { AdminShell } from "@/features/admin/components/admin-shell";
import { env } from "@/lib/env";

export default function AdminSocialPage() {
  return (
    <AdminShell title="Sosyal giriş ve moderasyon" description="Google ve diğer sosyal giriş sağlayıcılarının durumunu ve sosyal içerik moderasyonunu yönetin.">
      <section className="panel mb-6 p-6"><p className="text-xs uppercase tracking-[0.22em] text-accent">Kimlik sağlayıcıları</p><h2 className="mt-2 text-2xl font-semibold">Giriş seçenekleri</h2><div className="mt-5 grid gap-3 md:grid-cols-3">{[{ name: "Google", active: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) }, { name: "Apple", active: false }, { name: "Facebook", active: false }].map((provider) => <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-strong px-4 py-4" key={provider.name}><span className="font-semibold">{provider.name}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${provider.active ? "bg-accent/15 text-accent" : "bg-danger/10 text-danger"}`}>{provider.active ? "Aktif" : "Yapılandırılmadı"}</span></div>)}</div><p className="mt-4 text-sm text-muted">Google için GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET; diğer sağlayıcılar için ilgili OAuth bilgilerini sunucu ortamına ekleyin.</p></section>
      <section className="grid gap-4 md:grid-cols-2">
        {["Yorumlar", "Storyler", "Playlistler", "Raporlar"].map((item) => (
          <article className="panel p-6" key={item}>
            <h2 className="text-lg font-semibold">{item}</h2>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
