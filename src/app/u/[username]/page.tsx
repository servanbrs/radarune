/* eslint-disable @next/next/no-img-element -- Profile and playlist artwork may be external user-managed URLs. */
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect, notFound } from "next/navigation";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { StructuredData } from "@/features/seo/components/structured-data";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { UserProfileShareButton } from "@/features/users/components/user-profile-share-button";
import { userProfileService } from "@/features/users/server/services/user-profile.service";
import { getRequestLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const result = await userProfileService.getPublicProfile(username.toLowerCase());
  const description = result.profile
    ? `${result.profile.name} tarafından Radarune'da oluşturulan herkese açık listeleri keşfet.`
    : "Radarune kullanıcı profili";
  return {
    title: result.profile ? `${result.profile.name} | Radarune` : "Kullanıcı profili | Radarune",
    description,
    alternates: result.profile ? { canonical: `/u/${result.profile.username}` } : undefined,
    openGraph: result.profile ? { title: `${result.profile.name} | Radarune`, description, type: "profile", url: `/u/${result.profile.username}`, images: result.profile.image ? [result.profile.image] : [] } : undefined,
    robots: { index: Boolean(result.profile), follow: Boolean(result.profile) },
  };
}

export default async function PublicUserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const result = await userProfileService.getPublicProfile(username.toLowerCase());
  if (result.redirectTo) permanentRedirect(`/u/${result.redirectTo}`);
  if (!result.profile) notFound();
  const session = await authSessionService.getOptionalSession();
  const locale = await getRequestLocale();
  const profile = result.profile;
  return (
    <PublicGrowthShell currentUser={session ? { name: session.user.name } : null} locale={locale}>
      <StructuredData data={{ "@context": "https://schema.org", "@type": "Person", name: profile.name, url: `https://radarune.com/u/${profile.username}`, image: profile.image ?? undefined, sameAs: [`https://radarune.com/u/${profile.username}`] }} />
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[#081311] text-white shadow-[0_30px_100px_rgba(4,15,13,0.22)]">
        <div className="relative overflow-hidden px-6 py-12 sm:px-10 sm:py-16">
          <div aria-hidden className="absolute -right-24 -top-32 size-80 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end gap-6">
            <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 text-4xl font-black text-emerald-300 shadow-2xl">
              {profile.image ? <img alt="" className="size-full object-cover" src={profile.image} /> : profile.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Radarune community profile</p>
              <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">{profile.name}</h1>{profile.emailVerified ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold text-[#08201a]">✓ E-posta doğrulandı</span> : null}</div>
              <p className="mt-2 text-sm text-white/55">@{profile.username} · Radarune topluluk üyesi</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <UserProfileShareButton username={profile.username ?? ""} />
                <Link className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-bold text-[#08201a]" href="/lists">Listeleri keşfet →</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-8 bg-white p-6 text-foreground sm:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-black/10 bg-[#f2f7f4] p-2 text-center">
              <div className="rounded-xl bg-white p-3"><p className="text-xl font-black">{profile._count.playlists}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Public liste</p></div>
              <div className="rounded-xl bg-white p-3"><p className="text-xl font-black">{profile._count.follows}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Sanatçı takibi</p></div>
              <div className="rounded-xl bg-white p-3"><p className="text-xl font-black">{profile._count.playlistLikes}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Liste beğenisi</p></div>
            </div>
            <div className="mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Kürasyon vitrini</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Public listeler</h2></div><span className="text-xs text-muted">{profile._count.playlists} liste</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {profile.playlists.map((playlist) => <Link className="group overflow-hidden rounded-2xl border border-black/10 bg-[#f7faf8] transition hover:-translate-y-0.5 hover:border-emerald-300" href={playlist.slug ? `/playlist/${playlist.slug}` : `/playlists/${playlist.id}`} key={playlist.id}><div className="aspect-[1.8] bg-gradient-to-br from-emerald-200/70 via-[#dce9ff] to-[#111d1a]">{playlist.coverImageUrl ? <img alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" src={playlist.coverImageUrl} /> : null}</div><div className="p-4"><p className="truncate font-bold">{playlist.name}</p><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted">{playlist.description ?? "Radarune topluluğundan seçilmiş parçalar."}</p><div className="mt-3 flex justify-between text-[11px] text-muted"><span>{playlist._count.tracks} parça</span><span>{playlist._count.likes} beğeni</span></div></div></Link>)}
              {profile.playlists.length === 0 ? <p className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-muted sm:col-span-2">Bu kullanıcı henüz herkese açık bir liste yayınlamadı.</p> : null}
            </div>
          </div>
          <aside className="space-y-5">
            <article className="rounded-2xl border border-black/10 bg-[#f7faf8] p-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Radarune hikâyesi</p><h2 className="mt-3 text-xl font-black">Müziği birlikte keşfet.</h2><p className="mt-2 text-sm leading-6 text-muted">Bu profil, Radarune topluluğunda oluşturulan listeleri ve müzik keşiflerini tek bir paylaşılabilir adreste toplar.</p></article>
            <article className="rounded-2xl border border-black/10 p-5"><p className="text-xs uppercase tracking-[0.2em] text-muted">Katılım tarihi</p><p className="mt-2 text-lg font-bold">{new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(profile.createdAt)}</p><p className="mt-1 text-sm text-muted">Radarune topluluğuna katıldı</p></article>
          </aside>
        </div>
      </section>
    </PublicGrowthShell>
  );
}
