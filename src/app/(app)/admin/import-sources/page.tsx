import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";
import { ImportSourceCreateForm } from "@/features/integrations/components/import-source-create-form";

export default async function ImportSourcesPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const sources = await importSourceService.list(actor);
  return (
    <AdminShell title="Otomatik müzik import kaynakları" description="Sadece resmi provider API ve embed akışlarıyla çalışan tenant kaynaklarını izleyin.">
      <ImportSourceCreateForm />
      <section className="panel mb-6 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Aktarılan içerikleri inceleyin</p>
          <p className="mt-1 text-sm text-muted">Kanal, playlist ve Mix çekimleri otomatik yayınlanmaz; onay bekleyen moderasyon kuyruğuna düşer.</p>
        </div>
        <Link className="inline-flex w-fit items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-accent" href="/admin/import-review">
          Aktarım moderasyonunu aç →
        </Link>
      </section>
      <section className="panel p-6">
        <SimpleTable columns={["Kaynak", "Provider", "Durum", "Son kontrol", "Çalışma"]} rows={sources.map((source) => [
          <div key={source.id}><p className="font-semibold">{source.name}</p><p className="mt-1 text-xs text-muted">{source.url.startsWith("search://") ? "Arama tabanlı kaynak" : source.url}</p>{source.runs[0] ? <p className="mt-1 text-xs text-muted">Son çekim: {source.runs[0].detectedCount} bulundu · {source.runs[0].importedCount} alındı · {source.runs[0].duplicateCount} tekrar</p> : null}</div>,
          source.provider ?? "-",
          source.status,
          source.lastCheckedAt?.toLocaleString("tr-TR") ?? "Henüz çalışmadı",
          <Link className="font-semibold text-accent" href={`/admin/import-sources/${source.id}`} key={`${source.id}-link`}>Detayı aç</Link>,
        ])} />
      </section>
    </AdminShell>
  );
}
