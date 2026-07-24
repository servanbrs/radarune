import { SignOutButton } from "@/features/authentication/components/sign-out-button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionProviderRegistry } from "@/features/distribution-hub/server/provider-registry";
import { labelService } from "@/features/label/server/services/label.service";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function DashboardPage() {
  const { organization, session, user } = await authSessionService.getDashboardContext();
  const [labels, artists] = await Promise.all([
    labelService.listByOrganizationId(organization.organization.id),
    artistService.listByOrganizationId(organization.organization.id),
  ]);
  const providerAdapters = distributionProviderRegistry.listAdapters();
  const permissions = rbacService.listPermissions(organization.role);

  return (
    <main className="page-shell">
      <div className="flex w-full flex-col gap-6">
        <section className="panel overflow-hidden">
          <div className="grid gap-8 px-8 py-8 md:grid-cols-[1fr_auto] md:px-10">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-accent/20 bg-accent/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Sprint 1 organization foundation
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold">Welcome back, {user.name}</h1>
                <p className="max-w-3xl text-base leading-8 text-muted">
                  Your workspace is now scoped to an organization boundary, which
                  gives Radarune the tenant context required for labels, artists,
                  releases, permissions, and future provider routing.
                </p>
              </div>
            </div>
            <div className="flex items-start md:justify-end">
              <div className="hidden md:block">
                <SignOutButton />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Organization
            </p>
            <p className="mt-3 text-2xl font-semibold">{organization.organization.name}</p>
            <p className="mt-2 text-sm text-muted">
              Role: {organization.role} · Slug: {organization.organization.slug}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Labels
            </p>
            <p className="mt-3 text-2xl font-semibold">{labels.length}</p>
            <p className="mt-2 text-sm text-muted">Catalog labels in this organization</p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Artists
            </p>
            <p className="mt-3 text-2xl font-semibold">{artists.length}</p>
            <p className="mt-2 text-sm text-muted">Artist records in this organization</p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Account
            </p>
            <p className="mt-3 text-2xl font-semibold">{user.email}</p>
            <p className="mt-2 text-sm text-muted">
              Email verified: {user.emailVerified ? "Yes" : "No"}
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Distribution adapters
            </p>
            <p className="mt-3 text-2xl font-semibold">{providerAdapters.length}</p>
            <p className="mt-2 text-sm text-muted">
              ONErpm, FUGA, Symphonic, Revelator, and Internal contracts are registered.
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Team size
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {organization.organization._count.memberships}
            </p>
            <p className="mt-2 text-sm text-muted">Current organization memberships</p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Session expiry
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {dateFormatter.format(session.session.expiresAt)}
            </p>
            <p className="mt-2 text-sm text-muted">
              Current active browser session
            </p>
          </article>
        </section>

        <section className="panel p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Effective permissions
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <span
                className="rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                key={permission}
              >
                {permission}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
