import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { webhookEndpointService } from "@/features/platform/server/services/webhook-endpoint.service";

export default async function AdminWebhooksPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const endpoints = await webhookEndpointService.list(actor);
  return <AdminShell title="Webhook endpoint’leri" description="HTTPS endpoint’leri tenant kapsamında yönetilir; delivery imzaları HMAC ve idempotency anahtarıyla hazırlanır."><section className="panel p-6"><SimpleTable columns={["URL", "Olaylar", "Durum", "Delivery"]} rows={endpoints.map((endpoint) => [endpoint.url, endpoint.subscriptions.map((subscription) => subscription.eventType).join(", "), endpoint.active ? "Aktif" : "Pasif", String(endpoint._count.deliveries)])} /></section></AdminShell>;
}
