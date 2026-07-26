import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";

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

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Webhooklar</p>
        <h1 className="mt-3 text-3xl font-semibold">Provider webhook eventleri</h1>
      </section>
      <section className="panel divide-y divide-line">
        {events.map((event) => (
          <article className="grid gap-3 p-5 text-sm md:grid-cols-[0.6fr_1fr_0.6fr_0.6fr]" key={event.id}>
            <span className="font-semibold">{event.provider}</span>
            <span className="break-all">{event.externalEventId}</span>
            <span>{event.processingStatus}</span>
            <span>{event.signatureVerified ? "İmza geçerli" : "İmza yok/geçersiz"}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
