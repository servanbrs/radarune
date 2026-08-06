import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { webhookEndpointService } from "@/features/platform/server/services/webhook-endpoint.service";
import { WebhookEndpointForm } from "@/features/platform/components/webhook-endpoint-form";

export default async function AdminWebhooksPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const endpoints = await webhookEndpointService.list(actor);
  return <AdminShell title="Webhook endpoint’leri" description="Webhook, Radarune’daki yayın ve dağıtım olaylarını güvenli imzayla başka bir otomasyon veya sunucuya iletir. Sosyal medya otomasyonu için Make, n8n veya kendi sunucunuzu bağlayabilirsiniz."><section className="panel p-6"><p className="text-sm leading-6 text-muted">Webhook bir yayınlandığında seçtiğiniz URL’ye olay gönderir. Radarune hesabınızın Facebook, Instagram veya X hesabına doğrudan erişmez; bunun için bağlı otomasyon hesabı ve platform izinleri gerekir.</p><WebhookEndpointForm /></section><section className="panel mt-5 p-6"><h2 className="text-lg font-semibold">Kayıtlı endpoint’ler</h2><div className="mt-4"><SimpleTable columns={["URL", "Olaylar", "Durum", "Gönderim"]} rows={endpoints.map((endpoint) => [endpoint.url, endpoint.subscriptions.map((subscription) => subscription.eventType).join(", "), endpoint.active ? "Aktif" : "Pasif", String(endpoint._count.deliveries)])} /></div></section></AdminShell>;
}
