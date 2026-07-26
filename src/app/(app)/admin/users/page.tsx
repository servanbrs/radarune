import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { UserRoleBadge, UserStatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export default async function AdminUsersPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const users = await adminUserService.listUsers(actor, { page: 1, pageSize: 50 });

  return (
    <AdminShell title="Kullanıcı yönetimi" description="Roller, hesap durumları ve kullanıcı ilişkileri sunucu tarafı RBAC ile yönetilir.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Ad", "E-posta", "Rol", "Durum", "E-posta", "Organizasyon", "Kayıt"]}
          rows={users.items.map((item) => [
            <Link className="font-semibold hover:underline" href={`/admin/users/${item.id}`} key={item.id}>{item.name}</Link>,
            item.email,
            <UserRoleBadge value={item.systemRole} key={`${item.id}-role`} />,
            <UserStatusBadge value={item.accountStatus} key={`${item.id}-status`} />,
            item.emailVerified ? "Doğrulanmış" : "Doğrulanmamış",
            item.memberships.map((membership) => membership.organization.name).join(", ") || "Yok",
            item.createdAt.toLocaleDateString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
