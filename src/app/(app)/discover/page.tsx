import Link from "next/link";
import { GlobalPlayer } from "@/features/growth/components/global-player";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { discoverService } from "@/features/growth/server/services/discover.service";

export default async function DiscoverPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const candidates = await discoverService.getCandidates(actor);

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Discover</p>
        <h1 className="mt-3 text-3xl font-semibold">Yeni müzik keşfet</h1>
        <p className="mt-3 text-sm leading-7 text-muted">Öneriler açıklanabilir deterministic scoring ile üretilir.</p>
      </section>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {candidates.map((release) => (
          <article className="panel p-5" key={release.id}>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{release.primaryGenre}</p>
            <h2 className="mt-3 text-xl font-semibold">{release.title}</h2>
            <p className="mt-2 text-sm text-muted">{release.artists.map((item) => item.artist.name).join(", ")}</p>
            <p className="mt-4 text-xs text-muted">Skor: {release.score}</p>
            <Link className="mt-5 inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white" href={`/artist/${release.artists[0]?.artist.slug ?? ""}`}>Sanatçı profili</Link>
          </article>
        ))}
      </section>
      <GlobalPlayer />
    </main>
  );
}
