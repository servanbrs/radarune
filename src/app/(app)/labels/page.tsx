import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { CreateLabelForm } from "@/features/label/components/create-label-form";
import { labelService } from "@/features/label/server/services/label.service";
import { getStatusLabel } from "@/features/admin/components/status-badges";

export default async function LabelsPage() {
  const { organization } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingPermission(organization.role, "label:view");

  const labels = await labelService.listByOrganizationId(organization.organization.id);
  const canCreate = rbacService.hasPermission(organization.role, "label:create");

  return (
    <main className="page-shell">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="panel p-6 md:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Label registry</p>
            <h1 className="text-3xl font-semibold">Labels</h1>
            <p className="text-sm leading-7 text-muted">
              Manage label entities inside the current organization boundary.
            </p>
          </div>
          {canCreate ? (
            <div className="mt-8">
              <CreateLabelForm labels={labels.map(({ id, name }) => ({ id, name }))} />
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border bg-white/60 px-4 py-3 text-sm text-muted">
              Your current role can view labels, but cannot create them.
            </p>
          )}
        </section>

        <section className="panel p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Current catalog</p>
              <h2 className="mt-2 text-2xl font-semibold">{labels.length} labels</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {labels.length === 0 ? (
              <p className="rounded-2xl border bg-white/60 px-4 py-6 text-sm text-muted">
                No labels exist in this organization yet.
              </p>
            ) : (
              labels.map((label) => (
                <article className="rounded-[1.5rem] border bg-white/70 p-5" key={label.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{label.name}</h3>
                      <p className="mt-1 text-sm text-muted">Slug: {label.slug}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-accent">{label.parentLabel ? `Sublabel · ${label.parentLabel.name}` : "Ana label"}</p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {getStatusLabel(label.status, organization.organization.defaultLocale)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    Legal name: {label.legalName ?? "Not set"}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Linked artists: {label._count.artistLinks}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
