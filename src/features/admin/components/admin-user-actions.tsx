"use client";

import { useState } from "react";
import type { AppPermission, SystemRole } from "@/features/authorization/server/rbac";
import { getPermissionLabel, permissionGroups, systemRoles } from "@/features/authorization/permission-catalog";

type Props = {
  userId: string;
  role: string;
  status: string;
  permissionsByRole: Record<SystemRole, readonly AppPermission[]>;
};

export function AdminUserActions({ userId, role, status, permissionsByRole }: Props) {
  const [selectedRole, setSelectedRole] = useState<SystemRole>(role as SystemRole);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const permissions = new Set(permissionsByRole[selectedRole] ?? []);

  async function update(kind: "role" | "status", value: string) {
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/admin/users/${userId}/${kind}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        kind === "role"
          ? { role: value, reason: "Admin kullanıcı yetkilendirmesi güncellendi." }
          : { status: value, reason: "Admin kullanıcı hesap durumu güncellendi." },
      ),
    });
    const data = await response.json().catch(() => null);
    setPending(false);
    setMessage(response.ok ? "Değişiklik kaydedildi." : data?.error ?? "Güncelleme başarısız.");
    if (response.ok) window.location.reload();
  }

  return (
    <section className="panel border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Yetkilendirme</p>
          <h2 className="mt-2 text-lg font-semibold">Rol ve erişim izinleri</h2>
          <p className="mt-1 text-sm text-muted">Rol değiştiğinde bu kullanıcının admin panelinde göreceği bölümler de değişir.</p>
        </div>
        <span className="rounded-full border border-line bg-surface-strong px-3 py-1 text-sm text-muted">{permissions.size} izin</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-muted">Sistem rolü
          <select className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-foreground" disabled={pending} onChange={(event) => { setSelectedRole(event.target.value as SystemRole); void update("role", event.target.value); }} value={selectedRole}>
            {systemRoles.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-muted">Hesap durumu
          <select className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-foreground" disabled={pending} onChange={(event) => void update("status", event.target.value)} value={status}>
            <option value="ACTIVE">ACTIVE · Aktif</option><option value="SUSPENDED">SUSPENDED · Askıda</option><option value="BANNED">BANNED · Yasaklı</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {permissionGroups.map((group) => {
          const active = group.permissions.filter((permission) => permissions.has(permission));
          if (!active.length) return null;
          return <div className="rounded-2xl border border-line bg-surface-strong/60 p-4" key={group.name}>
            <h3 className="font-semibold">{group.name}</h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted">{active.map((permission) => <li className="flex items-start gap-2" key={permission}><span className="mt-1 text-accent">●</span>{getPermissionLabel(permission)}</li>)}</ul>
          </div>;
        })}
      </div>
      {!permissions.size ? <p className="mt-5 rounded-xl border border-line bg-surface-strong p-4 text-sm text-muted">Bu rolün yönetim paneli izni yoktur.</p> : null}
      {message ? <p className="mt-4 text-sm text-muted" role="status">{message}</p> : null}
    </section>
  );
}
