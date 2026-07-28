import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminDashboardService } from "@/features/admin/server/services/admin-dashboard.service";

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
        <AdminStatCard label="Askıya alınmış" value={dashboard.cards.suspendedUsers} tone="warn" />
        <AdminStatCard label="Yasaklı kullanıcı" value={dashboard.cards.bannedUsers} tone="danger" />
        <AdminStatCard label="Onaylı sanatçı" value={dashboard.cards.approvedArtists} />
        <AdminStatCard label="Bekleyen başvuru" value={dashboard.cards.pendingApplications} tone="warn" href="/admin/applications" />
        <AdminStatCard label="İnceleme bekleyen yayın" value={dashboard.cards.pendingReviewReleases} tone="warn" href="/admin/moderation" />
        <AdminStatCard label="Başarısız dağıtım" value={dashboard.cards.failedDistributionJobs} tone="danger" href="/admin/distribution/jobs" />
        <AdminStatCard label="Taslak yayın" value={dashboard.cards.draftReleases} />
        <AdminStatCard label="Revizyon yayın" value={dashboard.cards.revisionReleases} tone="warn" />
        <AdminStatCard label="Onaylanan yayın" value={dashboard.cards.approvedReleases} tone="good" />
        <AdminStatCard label="Canlı yayın" value={dashboard.cards.liveReleases} tone="good" href="/admin/releases" />
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><AdminStatCard label="Toplam dağıtım" value={dashboard.totalDistributionJobs} href="/admin/distribution" /><article className="rounded-3xl border border-line bg-surface p-5"><p className="text-xs uppercase tracking-[0.22em] text-muted">Son üyeler</p><div className="mt-3 space-y-2">{dashboard.recentUsers.slice(0,3).map(user=><p className="truncate text-sm" key={user.id}>{user.name} · {user.email}</p>)}</div><a className="mt-4 inline-block text-sm font-semibold text-accent" href="/admin/users">Tüm kullanıcılar →</a></article><article className="rounded-3xl border border-line bg-surface p-5"><p className="text-xs uppercase tracking-[0.22em] text-muted">En çok oy alan yayın</p><p className="mt-3 truncate text-lg font-semibold">{dashboard.popularReleases[0]?.title ?? "Henüz veri yok"}</p><p className="mt-1 text-sm text-muted">{dashboard.popularReleases[0]?._count.releaseLikes ?? 0} beğeni</p><a className="mt-4 inline-block text-sm font-semibold text-accent" href="/discover">Keşfeti aç →</a></article><article className="rounded-3xl border border-line bg-surface p-5"><p className="text-xs uppercase tracking-[0.22em] text-muted">Hızlı analiz</p><div className="mt-3 grid gap-2"><a className="rounded-xl bg-surface-strong px-3 py-2 text-sm font-medium" href="/analytics">Dinlenme ve ülkeler</a><a className="rounded-xl bg-surface-strong px-3 py-2 text-sm font-medium" href="/admin/site-builder">Site Builder</a></div></article></section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel bg-surface p-6">
          <h2 className="text-lg font-semibold">Yayın durum dağılımı</h2>
          <div className="mt-4 space-y-3">
            {dashboard.releaseStatusDistribution.map((item) => (
              <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-strong px-4 py-3" key={item.status}>
                <span className="text-sm font-medium">{item.status}</span>
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
                <span className="text-sm font-medium">{item.status}</span>
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
