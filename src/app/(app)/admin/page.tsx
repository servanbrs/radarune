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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Toplam kullanıcı" value={dashboard.cards.totalUsers} />
        <AdminStatCard label="Aktif kullanıcı" value={dashboard.cards.activeUsers} tone="good" />
        <AdminStatCard label="Askıya alınmış" value={dashboard.cards.suspendedUsers} tone="warn" />
        <AdminStatCard label="Yasaklı kullanıcı" value={dashboard.cards.bannedUsers} tone="danger" />
        <AdminStatCard label="Onaylı sanatçı" value={dashboard.cards.approvedArtists} />
        <AdminStatCard label="Bekleyen başvuru" value={dashboard.cards.pendingApplications} tone="warn" />
        <AdminStatCard label="İnceleme bekleyen yayın" value={dashboard.cards.pendingReviewReleases} tone="warn" />
        <AdminStatCard label="Başarısız job" value={dashboard.cards.failedDistributionJobs} tone="danger" />
        <AdminStatCard label="Taslak yayın" value={dashboard.cards.draftReleases} />
        <AdminStatCard label="Revizyon yayın" value={dashboard.cards.revisionReleases} tone="warn" />
        <AdminStatCard label="Onaylanan yayın" value={dashboard.cards.approvedReleases} tone="good" />
        <AdminStatCard label="Canlı yayın" value={dashboard.cards.liveReleases} tone="good" />
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><AdminStatCard label="Toplam dağıtım" value={dashboard.totalDistributionJobs} /><article className="rounded-3xl border border-[#26383a] bg-[#17272a] p-5"><p className="text-xs uppercase tracking-[0.22em] text-[#9aada9]">Son üyeler</p><div className="mt-3 space-y-2">{dashboard.recentUsers.slice(0,3).map(user=><p className="truncate text-sm text-[#eef7f5]" key={user.id}>{user.name} · {user.email}</p>)}</div></article><article className="rounded-3xl border border-[#26383a] bg-[#17272a] p-5"><p className="text-xs uppercase tracking-[0.22em] text-[#9aada9]">En çok oy alan yayın</p><p className="mt-3 truncate text-lg font-semibold text-[#eef7f5]">{dashboard.popularReleases[0]?.title ?? "Henüz veri yok"}</p><p className="mt-1 text-sm text-[#9aada9]">{dashboard.popularReleases[0]?._count.releaseLikes ?? 0} beğeni</p></article><article className="rounded-3xl border border-[#26383a] bg-[#17272a] p-5"><p className="text-xs uppercase tracking-[0.22em] text-[#9aada9]">Popüler sayfalar</p><p className="mt-3 text-sm text-[#eef7f5]">Keşfet · Analiz · Smart Link</p><p className="mt-1 text-xs text-[#9aada9]">İçerik performansı takip ediliyor</p></article></section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel border-[#26383a] bg-[#111d20] p-6">
          <h2 className="text-lg font-semibold">Yayın durum dağılımı</h2>
          <div className="mt-4 space-y-3">
            {dashboard.releaseStatusDistribution.map((item) => (
              <div className="flex items-center justify-between rounded-2xl border border-[#26383a] bg-[#17272a] px-4 py-3" key={item.status}>
                <span className="text-sm font-medium">{item.status}</span>
                <span className="text-sm text-muted">{item._count._all}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel border-[#26383a] bg-[#111d20] p-6">
          <h2 className="text-lg font-semibold">Distribution job dağılımı</h2>
          <div className="mt-4 space-y-3">
            {dashboard.jobStatusDistribution.map((item) => (
              <div className="flex items-center justify-between rounded-2xl border border-[#26383a] bg-[#17272a] px-4 py-3" key={item.status}>
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
