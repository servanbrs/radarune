import Link from "next/link";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
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
      title="Genel bakış"
      description="Bugünkü moderasyon, kullanıcı ve dağıtım durumunu hızlıca kontrol edin. Ayrıntılı analiz için V2 Kontrol Merkezi'ne geçin."
    >
      <section className="panel relative overflow-hidden border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/15 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Operasyon özeti
        </p>
        <div className="relative mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Bugün ne oluyor?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Günlük işleri hızlıca yönetin; trendler, ülke dağılımı ve canlı
              platform sinyalleri V2 merkezinde bulunur.
            </p>
          </div>
          <Link
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
            href="/admin/v2"
          >
            V2 Kontrol Merkezi →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Toplam kullanıcı" value={dashboard.cards.totalUsers} />
        <AdminStatCard label="Aktif hesap" value={dashboard.cards.activeUsers} tone="good" href="/admin/users" />
        <AdminStatCard label="Şu an çevrimiçi" value={dashboard.onlineUsers} tone="good" href="/admin/users" />
        <AdminStatCard label="Onaylı sanatçı" value={dashboard.cards.approvedArtists} />
        <AdminStatCard label="Canlı yayın" value={dashboard.cards.liveReleases} tone="good" href="/admin/releases" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Aksiyon kuyruğu
          </p>
          <h2 className="mt-2 text-xl font-semibold">Bugün aksiyon bekleyenler</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <AdminStatCard label="Bekleyen başvuru" value={dashboard.cards.pendingApplications} tone="warn" href="/admin/applications" />
            <AdminStatCard label="İnceleme bekleyen yayın" value={dashboard.cards.pendingReviewReleases} tone="warn" href="/admin/moderation" />
          </div>
        </article>

        <article className="panel bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Hızlı erişim
          </p>
          <h2 className="mt-2 text-xl font-semibold">Yönetim araçları</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link className="rounded-xl bg-surface-strong px-4 py-3 text-sm font-semibold transition hover:bg-accent/10" href="/admin/moderation">Yayın moderasyonu</Link>
            <Link className="rounded-xl bg-surface-strong px-4 py-3 text-sm font-semibold transition hover:bg-accent/10" href="/admin/distribution">Dağıtım merkezi</Link>
            <Link className="rounded-xl bg-surface-strong px-4 py-3 text-sm font-semibold transition hover:bg-accent/10" href="/admin/support">Destek mesajları</Link>
            <Link className="rounded-xl bg-surface-strong px-4 py-3 text-sm font-semibold transition hover:bg-accent/10" href="/admin/system/health">Sistem doktoru</Link>
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
