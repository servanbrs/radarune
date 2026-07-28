import Link from "next/link";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import {
  UserRoleBadge,
  UserStatusBadge,
} from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export default async function AdminUsersPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const users = await adminUserService.listUsers(actor, {
    page: 1,
    pageSize: 50,
  });

  return (
    <AdminShell
      title="Kullanıcı yönetimi"
      description="Kullanıcı rollerini, hesap durumlarını, e-posta doğrulamalarını ve organizasyon üyeliklerini yönetin."
    >
      <div className="flex justify-end"><Link className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href="/admin/users/new">Kullanıcı ekle</Link></div>
      <section className="panel min-w-0 p-3 sm:p-4 md:p-6">
        <SimpleTable
          columns={[
            "Ad",
            "E-posta adresi",
            "Rol",
            "Hesap durumu",
            "E-posta doğrulaması",
            "Organizasyon",
            "Kayıt tarihi",
          ]}
          emptyMessage="Henüz kayıtlı kullanıcı bulunmuyor."
          rows={users.items.map((item) => [
            <Link
              className="font-semibold text-foreground hover:text-accent hover:underline"
              href={`/admin/users/${item.id}`}
              key={`${item.id}-name`}
            >
              {item.name}
            </Link>,

            <span className="break-all" key={`${item.id}-email`}>
              {item.email}
            </span>,

            <UserRoleBadge
              key={`${item.id}-role`}
              value={item.systemRole}
            />,

            <UserStatusBadge
              key={`${item.id}-status`}
              value={item.accountStatus}
            />,

            item.emailVerified ? "Doğrulanmış" : "Doğrulanmamış",

            item.memberships
              .map((membership) => membership.organization.name)
              .join(", ") || "Organizasyon yok",

            item.createdAt.toLocaleDateString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
