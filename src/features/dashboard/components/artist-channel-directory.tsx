"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Music2, Search } from "lucide-react";
import { publicReleaseArtworkUrl } from "@/features/releases/lib/public-artwork-url";
import { releasePublicPath } from "@/features/releases/lib/release-url";

type ArtistChannel = {
  id: string;
  name: string;
  slug: string;
  profileImageUrl: string | null;
  releaseCount: number;
  followerCount: number;
  smartLinkCount: number;
  verified: boolean;
};

type ArtistRelease = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  artworkUploadId: string | null;
  trackCount: number;
  artistIds: string[];
};

type Labels = {
  artistProfile: string;
  edit: string;
  followers: string;
  link: string;
  noArtistProfile: string;
  noRelease: string;
  openProfile: string;
  release: string;
  searchPlaceholder: string;
  verifiedArtist: string;
};

type ArtistChannelDirectoryProps = {
  artists: ArtistChannel[];
  releases: ArtistRelease[];
  labels: Labels;
};

const liveStatuses = new Set(["APPROVED", "DISTRIBUTED", "LIVE"]);

const statusLabels: Record<string, string> = {
  APPROVED: "Onaylandı",
  DISTRIBUTED: "Dağıtımda",
  DRAFT: "Taslak",
  LIVE: "Yayında",
  PENDING_REVIEW: "İncelemede",
  PROCESSING: "İşleniyor",
  QUEUED: "Sırada",
  REJECTED: "Reddedildi",
  REMOVED: "Kaldırıldı",
  REVISION_REQUESTED: "Düzenleme gerekli",
  TAKEDOWN_REQUESTED: "Kaldırma talebi",
};

function artworkUrl(release: ArtistRelease) {
  if (!release.artworkUploadId) return null;
  return liveStatuses.has(release.status)
    ? publicReleaseArtworkUrl(release.id, release.updatedAt)
    : `/api/storage/private/${release.artworkUploadId}`;
}

export function ArtistChannelDirectory({ artists, releases, labels }: ArtistChannelDirectoryProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const visibleArtists = normalizedQuery
    ? artists.filter((artist) =>
        `${artist.name} ${artist.slug}`.toLocaleLowerCase("tr-TR").includes(normalizedQuery),
      )
    : artists;

  const releasesByArtist = new Map<string, ArtistRelease[]>();
  for (const release of releases) {
    for (const artistId of release.artistIds) {
      const current = releasesByArtist.get(artistId) ?? [];
      current.push(release);
      releasesByArtist.set(artistId, current);
    }
  }

  if (artists.length === 0) {
    return <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-sm text-white/50">{labels.noArtistProfile}</div>;
  }

  return (
    <>
      <label className="relative mt-5 block">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        <span className="sr-only">{labels.searchPlaceholder}</span>
        <input
          aria-label={labels.searchPlaceholder}
          className="w-full rounded-2xl border border-white/10 bg-black/15 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-emerald-300/50 focus:bg-black/25"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          type="search"
          value={query}
        />
      </label>

      {visibleArtists.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleArtists.map((artist) => {
            const artistReleases = releasesByArtist.get(artist.id) ?? [];
            return (
              <article className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.09]" key={artist.id}>
                <div className="flex items-center gap-3">
                  <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-300/15 text-lg font-bold text-emerald-200">
                    {artist.profileImageUrl ? <Image alt="" className="object-cover" fill sizes="48px" src={artist.profileImageUrl} unoptimized /> : artist.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{artist.name}</h3>
                      <span className="shrink-0 rounded-full bg-emerald-300/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">{artist.verified ? labels.verifiedArtist : labels.artistProfile}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-white/45">radarune.com/artist/{artist.slug}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-black/15 p-2"><p className="text-sm font-semibold">{artist.releaseCount}</p><p className="mt-1 text-[10px] text-white/40">{labels.release}</p></div>
                  <div className="rounded-xl bg-black/15 p-2"><p className="text-sm font-semibold">{artist.followerCount}</p><p className="mt-1 text-[10px] text-white/40">{labels.followers}</p></div>
                  <div className="rounded-xl bg-black/15 p-2"><p className="text-sm font-semibold">{artist.smartLinkCount}</p><p className="mt-1 text-[10px] text-white/40">{labels.link}</p></div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link className="flex-1 rounded-xl bg-emerald-300 px-3 py-2 text-center text-xs font-bold text-[#08201a]" href={`/artist/${artist.slug}`}>{labels.openProfile}</Link>
                  <Link className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white" href={`/dashboard/artists/${artist.id}/profile`}>{labels.edit}</Link>
                </div>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">Yayınlar</p>
                    <span className="text-[10px] text-white/40">{artistReleases.length}</span>
                  </div>
                  {artistReleases.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {artistReleases.slice(0, 4).map((release) => {
                        const artwork = artworkUrl(release);
                        return (
                          <Link className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 p-2 transition hover:bg-black/20" href={releasePublicPath(release.title, release.id)} key={`${artist.id}-${release.id}`}>
                            <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-emerald-200">
                              {artwork ? <Image alt="" className="object-cover" fill sizes="36px" src={artwork} unoptimized /> : <Music2 className="size-4" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-white/90">{release.title}</span>
                              <span className="mt-0.5 block text-[10px] text-white/45">{statusLabels[release.status] ?? release.status} · {release.trackCount} parça</span>
                            </span>
                            <ArrowRight className="size-3.5 shrink-0 text-emerald-200/70" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : <p className="mt-2 text-xs text-white/40">{labels.noRelease}</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-sm text-white/50">Aramanızla eşleşen sanatçı bulunamadı.</div>
      )}
    </>
  );
}
