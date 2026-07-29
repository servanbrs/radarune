import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { SimpleTable } from "@/features/admin/components/simple-table";
import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminDashboardService } from "@/features/admin/server/services/admin-dashboard.service";
import { getStatusLabel } from "@/features/admin/components/status-badges";

export default async function AdminPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const dashboard = await adminDashboardService.getDashboard(actor);

  return (
    <AdminShell
      title="Yönetim merkezi"
      description="Kullanıcılar, sanatçı başvuruları, yayın moderasyonu, distribution ve sistem kayıtları tek merkezden yönetilir."
    >
      <section className="panel relative overflow-hidden border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Kontrol odası</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h2 className="text-3xl font-semibold tracking-tight">Bugün ne oluyor?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">İnceleme, dağıtım ve büyüme sinyallerini tek ekrandan izleyin. Bir karta tıklayarak doğrudan ilgili iş akışına geçin.</p></div><div className="flex gap-2"><a className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href="/admin/moderation">İncelemeleri aç</a><a className="rounded-full border border-line bg-surface-strong px-4 py-2 text-sm font-semibold" href="/admin/distribution">Dağıtım merkezi</a></div></div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Toplam kullanıcı" value={dashboard.cards.totalUsers} />
        <AdminStatCard label="Aktif kullanıcı" value={dashboard.cards.activeUsers} tone="good" />
        <AdminStatCard label="Onaylı sanatçı" value={dashboard.cards.approvedArtists} />
        <AdminStatCard label="Canlı yayın" value={dashboard.cards.liveReleases} tone="good" href="/admin/releases" />
      </section>
      <section className="panel bg-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Üye büyümesi</p><h2 className="mt-2 text-xl font-semibold">Kayıt trendi</h2><p className="mt-1 text-sm text-muted">Günlük, aylık ve yıllık yeni üyeleri aynı ekranda izleyin.</p></div><Link className="text-sm font-semibold text-accent" href="/admin/users">Kullanıcı yönetimi →</Link></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{([['Bugün', dashboard.userGrowth.daily[new Date().toISOString().slice(0, 10)] ?? 0], ['Bu ay', dashboard.userGrowth.monthly[new Date().toISOString().slice(0, 7)] ?? 0], ['Bu yıl', dashboard.userGrowth.yearly[new Date().getUTCFullYear().toString()] ?? 0] ] as const).map(([label, value]) => <div className="rounded-2xl border border-line bg-surface-strong p-4" key={label}><p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted">yeni kayıt</p></div>)}</div>
        <div className="mt-5 flex h-24 items-end gap-1 rounded-2xl border border-line bg-surface-strong p-3">{Object.entries(dashboard.userGrowth.daily).slice(-14).map(([day, count]) => <div className="group flex h-full flex-1 flex-col justify-end gap-1" key={day}><div className="min-h-1 rounded-t bg-accent transition-all" style={{ height: `${Math.max(8, Math.min(100, count * 18))}%` }} title={`${day}: ${count} kayıt`} /><span className="text-center text-[9px] text-muted">{day.slice(8)}</span></div>)}</div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel bg-surface p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">İnceleme kuyruğu</p><h2 className="mt-2 text-xl font-semibold">Bugün aksiyon bekleyenler</h2></div><Link className="text-sm font-semibold text-accent" href="/admin/moderation">Kuyruğu aç →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><AdminStatCard label="Bekleyen başvuru" value={dashboard.cards.pendingApplications} tone="warn" href="/admin/applications" /><AdminStatCard label="İnceleme bekleyen yayın" value={dashboard.cards.pendingReviewReleases} tone="warn" href="/admin/moderation" /></div></article>
        <article className="panel bg-surface p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Import merkezi</p><h2 className="mt-2 text-xl font-semibold">Kaynak ve içerik durumu</h2></div><Link className="text-sm font-semibold text-accent" href="/admin/import-sources">Kaynakları yönet →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><AdminStatCard label="Bekleyen" value={dashboard.pendingImports} tone="warn" href="/admin/import-review" /><AdminStatCard label="İçe aktarılan" value={dashboard.importedItems} tone="good" href="/admin/import-review" /><AdminStatCard label="Aktif kaynak" value={dashboard.activeImportedSources} href="/admin/import-sources" /></div></article>
      </section>
      <section className="panel bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Import akışı</p><h2 className="mt-2 text-xl font-semibold">Son içe aktarılan şarkılar</h2></div>
          <a className="text-sm font-semibold text-accent" href="/admin/import-review">Tüm importları gör →</a>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.recentImports.length ? dashboard.recentImports.map((item) => <div className="rounded-2xl border border-line bg-surface-strong p-4" key={item.id}><p className="truncate font-semibold">{item.externalMediaSource?.title ?? "İsimsiz içerik"}</p><p className="mt-1 truncate text-sm text-muted">{item.externalMediaSource?.artistName ?? "Bilinmeyen sanatçı"} · {item.externalMediaSource?.provider ?? ""}</p><span className="mt-3 inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">{item.status === "IMPORTED" ? "İçe aktarıldı" : "Onaylandı"}</span></div>) : <p className="text-sm text-muted">Henüz onaylanmış import bulunmuyor.</p>}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><AdminStatCard label="Toplam dağıtım" value={dashboard.totalDistributionJobs} href="/admin/distribution" /><article className="rounded-3xl border border-line bg-surface p-5"><p className="text-xs uppercase tracking-[0.22em] text-muted">Son üyeler</p><div className="mt-3 space-y-2">{dashboard.recentUsers.slice(0,3).map(user=><p className="truncate text-sm" key={user.id}>{user.name} · {user.email}</p>)}</div><Link className="mt-4 inline-block text-sm font-semibold text-accent" href="/admin/users">Tüm kullanıcılar →</Link></article><article className="rounded-3xl border border-line bg-surface p-5"><p className="text-xs uppercase tracking-[0.22em] text-muted">En çok oy alan yayın</p><p className="mt-3 truncate text-lg font-semibold">{dashboard.popularReleases[0]?.title ?? "Henüz oy verilmiş yayın yok"}</p><p className="mt-1 text-sm text-muted">{dashboard.popularReleases[0]?._count.releaseLikes ?? 0} gerçek topluluk oyu</p><Link className="mt-4 inline-block text-sm font-semibold text-accent" href="/discover">Keşfeti aç →</Link></article><article className="rounded-3xl border border-line bg-surface p-5"><p className="text-xs uppercase tracking-[0.22em] text-muted">Hızlı erişim</p><div className="mt-3 grid gap-2"><Link className="rounded-xl bg-surface-strong px-3 py-2 text-sm font-medium" href="/analytics">Dinlenme ve ülkeler</Link><Link className="rounded-xl bg-surface-strong px-3 py-2 text-sm font-medium" href="/admin/site-builder">Site Builder</Link></div></article></section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel bg-surface p-6">
          <h2 className="text-lg font-semibold">Yayın durum dağılımı</h2>
          <div className="mt-4 space-y-3">
            {dashboard.releaseStatusDistribution.map((item) => (
              <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-strong px-4 py-3" key={item.status}>
                <span className="text-sm font-medium">{getStatusLabel(item.status, organization.organization.defaultLocale)}</span>
                <span className="text-sm text-muted">{item._count._all}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel bg-surface p-6">
          <h2 className="text-lg font-semibold">Distribution job dağılımı</h2>
          <div className="mt-4 space-y-3">
            {dashboard.jobStatusDistribution.map((item) => (
              <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-strong px-4 py-3" key={item.status}>
                <span className="text-sm font-medium">{getStatusLabel(item.status, organization.organization.defaultLocale)}</span>
                <span className="text-sm text-muted">{item._count._all}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Son admin işlemleri</h2>
        <div className="mt-4">
          <SimpleTable
            columns={["İşlem", "Varlık", "Admin", "Tarih"]}
            rows={dashboard.recentAuditLogs.map((log) => [
              log.action,
              `${log.entityType}${log.entityId ? ` / ${log.entityId}` : ""}`,
              log.actorUser?.name ?? "Sistem",
              log.createdAt.toLocaleString("tr-TR"),
            ])}
          />
        </div>
      </section>
    </AdminShell>
  );
}
