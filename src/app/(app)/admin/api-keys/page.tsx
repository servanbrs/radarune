import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { apiKeyService } from "@/features/platform/server/services/api-key.service";

export default async function AdminApiKeysPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const keys = await apiKeyService.list(actor);
  return <AdminShell title="Public API anahtarları" description="Anahtarların hash değeri saklanır; tam anahtar yalnızca oluşturma yanıtında bir kez gösterilir."><section className="panel p-6"><SimpleTable columns={["Ad", "Prefix", "Scope", "Son kullanım", "Durum"]} rows={keys.map((key) => [key.name, key.prefix, Array.isArray(key.scopes) ? key.scopes.join(", ") : "", key.lastUsedAt?.toLocaleString("tr-TR") ?? "Henüz kullanılmadı", key.revokedAt ? "İptal edildi" : "Aktif"])} /></section></AdminShell>;
}
