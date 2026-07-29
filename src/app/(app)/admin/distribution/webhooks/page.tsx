import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminDistributionWebhooksPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const events = await adminDistributionService.listWebhooks({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  return <AdminShell title="Provider webhookları" description="Provider'lardan gelen durum bildirimlerini, imza doğrulamasını ve işleme sonuçlarını izleyin.">
      <section className="panel overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Son webhook eventleri</h2><p className="mt-1 text-sm text-muted">İmzası doğrulanmayan eventler dağıtım durumunu değiştirmez.</p></div>
        {events.length === 0 ? <div className="p-10 text-center"><p className="font-semibold">Henüz webhook alınmadı</p><p className="mt-2 text-sm text-muted">Provider webhook URL'si yapılandırıldığında eventler burada görünecek.</p></div> : <div className="divide-y divide-line">
        {events.map((event) => (
          <article className="grid gap-3 p-5 text-sm md:grid-cols-[0.6fr_minmax(0,1fr)_0.7fr_0.8fr]" key={event.id}>
            <span className="font-semibold">{event.provider}</span>
            <span className="break-all">{event.externalEventId}</span>
            <span><span className="rounded-full border border-line px-2 py-1 text-xs font-semibold">{event.processingStatus}</span>{event.errorMessage ? <span className="mt-2 block truncate text-xs text-danger">{event.errorMessage}</span> : null}</span>
            <span className={event.signatureVerified ? "text-accent" : "text-danger"}>{event.signatureVerified ? "İmza geçerli" : "İmza yok/geçersiz"}<span className="mt-1 block text-xs text-muted">{new Date(event.receivedAt).toLocaleString("tr-TR")}</span></span>
          </article>
        ))}
        </div>}
      </section>
    </AdminShell>;
}
