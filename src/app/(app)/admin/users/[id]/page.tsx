import { notFound } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { StatusBadge, UserRoleBadge, UserStatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const detail = await adminUserService.getUser(actor, id);
  if (!detail) {
    notFound();
  }

  return (
    <AdminShell title={detail.name} description="Kullanıcı rolü, hesap durumu, sanatçı profilleri, organizasyonları ve yayınları.">
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Hesap</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p>E-posta: {detail.email}</p>
            <p>Rol: <UserRoleBadge value={detail.systemRole} /></p>
            <p>Durum: <UserStatusBadge value={detail.accountStatus} /></p>
            <p>E-posta doğrulama: {detail.emailVerified ? "Doğrulanmış" : "Doğrulanmamış"}</p>
          </div>
        </article>
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Organizasyonlar</h2>
          <div className="mt-4 space-y-3 text-sm">
            {detail.memberships.map((membership) => (
              <p key={membership.id}>{membership.organization.name} · {membership.role}</p>
            ))}
          </div>
        </article>
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Yayınlar</h2>
        <div className="mt-4 grid gap-3">
          {detail.createdReleases.map((release) => (
            <div className="rounded-2xl border border-line bg-white/70 p-4" key={release.id}>
              <p className="font-semibold">{release.title}</p>
              <div className="mt-2"><StatusBadge value={release.status} /></div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
