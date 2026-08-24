import Link from "next/link";
import { ArrowUpRight, ExternalLink, Pencil, Sparkles } from "lucide-react";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { artistProfileService } from "@/features/artist/server/services/artist-profile.service";

const releaseStatusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  REVISION_REQUESTED: "Revizyon istendi",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  QUEUED: "Dağıtım kuyruğunda",
  PROCESSING: "Dağıtılıyor",
  DISTRIBUTED: "Dağıtıldı",
  LIVE: "Yayında",
  TAKEDOWN_REQUESTED: "Kaldırma bekliyor",
  REMOVED: "Kaldırıldı",
};

export default async function ArtistProfilePage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const organizationId = organization.organization.id;
  const [allArtists, editableArtistIds] = await Promise.all([
    artistService.listByOrganizationId(organizationId),
    artistProfileService.listEditableIds({
      organizationId,
      userId: user.id,
      systemRole: user.systemRole,
    }),
  ]);
  const editableArtistIdSet = new Set(editableArtistIds);
  const artists = allArtists.filter((artist) => editableArtistIdSet.has(artist.id));
  const releases = await artistProfileService.listEditableReleases({
    organizationId,
    userId: user.id,
    systemRole: user.systemRole,
    artistIds: artists.map((artist) => artist.id),
  });
  const releasesByArtist = new Map<string, typeof releases>();
  for (const release of releases) {
    for (const releaseArtist of release.artists) {
      const current = releasesByArtist.get(releaseArtist.artistId) ?? [];
      current.push(release);
      releasesByArtist.set(releaseArtist.artistId, current);
    }
  }
  return (
    <main className="page-shell">
      <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[#0a1715] p-6 text-white shadow-[0_24px_90px_rgba(4,15,13,0.18)] md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Artist profile</p>
        <h1 className="relative mt-3 text-3xl font-semibold">Sanatçı kanalların</h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-white/55">Yayınlarını, oylarını ve takipçi hareketini tek bir creator görünümünde yönet. Public kanalın site içi arama, Google ve paylaşılabilir profil bağlantılarıyla bulunabilir.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {artists.map((artist) => (
          <article className="panel overflow-hidden p-5" key={artist.id}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Artist channel</p><h2 className="mt-2 text-xl font-semibold">{artist.name}</h2><p className="mt-1 truncate text-xs text-muted">radarune.com/artist/{artist.slug}</p></div><span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Sparkles className="size-4" /></span></div>
            <div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl border border-line bg-surface-strong/60 p-3"><p className="text-lg font-semibold">{artist._count.releaseArtistLinks}</p><p className="text-[10px] uppercase tracking-wider text-muted">Yayın</p></div><div className="rounded-xl border border-line bg-surface-strong/60 p-3"><p className="text-lg font-semibold">{artist._count.follows}</p><p className="text-[10px] uppercase tracking-wider text-muted">Takipçi</p></div><div className="rounded-xl border border-line bg-surface-strong/60 p-3"><p className="text-lg font-semibold">{artist._count.smartLinks}</p><p className="text-[10px] uppercase tracking-wider text-muted">Smart Link</p></div></div>
            <div className="mt-6 border-t border-line pt-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Yayınların</h3><span className="text-xs text-muted">{(releasesByArtist.get(artist.id) ?? []).length} kayıt</span></div><div className="mt-3 grid gap-3">{(releasesByArtist.get(artist.id) ?? []).map((release) => { const artworkId = release.artworkUploadId ?? release.uploads[0]?.id; return <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-strong/40 p-3" key={`${artist.id}-${release.id}`}><div className="w-20 shrink-0"><div className="size-14 overflow-hidden rounded-xl bg-gradient-to-br from-accent/25 to-surface-strong">{artworkId ? <img alt={`${release.title} kapak`} className="size-full object-cover" src={`/api/releases/${release.id}/artwork`} /> : null}</div><span className="mt-2 inline-flex max-w-full rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-semibold leading-tight text-accent">{releaseStatusLabels[release.status] ?? release.status}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{release.title}</p><p className="mt-1 text-xs text-muted">{release._count.tracks} parça · {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(release.updatedAt)}</p></div><Link className="shrink-0 rounded-xl border border-line px-3 py-2 text-xs font-semibold hover:border-accent" href={`/releases/${release.id}/edit`}>Düzenle</Link></div>; })}{(releasesByArtist.get(artist.id) ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">Bu sanatçıya bağlı yayın bulunmuyor.</p> : null}</div></div>
            <div className="mt-5 flex flex-wrap gap-2"><Link className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background" href={`/artist/${artist.slug}`}>Kanalı aç <ExternalLink className="size-3.5" /></Link><Link className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold" href={`/artist-profile/analytics?artistId=${encodeURIComponent(artist.id)}`}>Analizler <ArrowUpRight className="size-3.5" /></Link><Link className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold" href={`/dashboard/artists/${artist.id}/profile`}>Düzenle <Pencil className="size-3.5" /></Link><Link className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold" href="/smart-links/new">Smart Link <ArrowUpRight className="size-3.5" /></Link></div>
          </article>
        ))}
      </section>
    </main>
  );
}
