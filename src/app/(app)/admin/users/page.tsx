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

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : undefined;
  const users = await adminUserService.listUsers(actor, {
    page: 1,
    pageSize: 50,
    ...(search ? { search } : {}),
  });

  return (
    <AdminShell
      title="Kullanıcı yönetimi"
      description="Kullanıcı rollerini, hesap durumlarını, e-posta doğrulamalarını ve organizasyon üyeliklerini yönetin."
    >
      <section className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Toplam sonuç</p><p className="mt-2 text-2xl font-bold">{users.total}</p></div><div className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Görüntülenen</p><p className="mt-2 text-2xl font-bold">{users.items.length}</p></div><div className="rounded-2xl border border-black/[0.06] bg-[#10201d] p-4 text-white"><p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Güvenli işlem</p><p className="mt-2 text-sm leading-5 text-white/60">Yeni kullanıcılar admin parolasıyla değil, davet hesabıyla oluşturulur.</p></div></section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><form className="flex min-w-0 flex-1 gap-2" method="GET"><input className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface-strong px-4 text-sm" defaultValue={search ?? ""} name="q" placeholder="Ad veya e-posta ara..." /><button className="rounded-full border border-line px-4 py-2 text-sm font-semibold" type="submit">Ara</button></form><Link className="rounded-full bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-foreground" href="/admin/users/new">Kullanıcı ekle</Link></div>
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
