import { notFound } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { importRepository } from "@/features/integrations/server/repositories/import.repository";

export default async function ImportSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const source = await importRepository.findSource(actor.organizationId, id);
  if (!source) notFound();
  const runs = await importRepository.listReviewItems(actor.organizationId);
  const sourceReviewItems = runs.filter((item) => item.source.id === source.id);
  return (
    <AdminShell title={source.name} description="Import kaynağının tenant kapsamındaki yapılandırmasını ve review sinyallerini görüntüleyin.">
      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted">Provider</p><p className="mt-2 text-lg font-semibold">{source.provider ?? "-"}</p><p className="mt-4 text-sm text-muted">{source.url}</p></article>
        <article className="panel p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted">Durum</p><p className="mt-2 text-lg font-semibold">{source.status}</p><p className="mt-4 text-sm text-muted">Son kontrol: {source.lastCheckedAt?.toLocaleString("tr-TR") ?? "Henüz yok"}</p></article>
      </section>
      <section className="panel p-6"><h2 className="text-lg font-semibold">Bekleyen içerik</h2><p className="mt-2 text-sm text-muted">Bu kaynak için {sourceReviewItems.length} adet review sinyali bulundu.</p></section>
    </AdminShell>
  );
}
