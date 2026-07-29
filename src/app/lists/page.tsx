import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { socialRepository } from "@/features/growth/server/repositories/social.repository";

export const dynamic = "force-dynamic";

const curated = [
  { slug: "en-cok-oylananlar", title: "En çok oylananlar", description: "Topluluğun oylarıyla öne çıkan yayınlar." },
  { slug: "en-fazla-dinlenenler", title: "En fazla dinlenenler", description: "En çok dinlenen ve tekrar keşfedilen şarkılar." },
  { slug: "global-dinlenenler", title: "Global dinlenenler", description: "Dünyadan Radarune dinleyicilerinin favorileri." },
];

export default async function ListsPage() {
  const playlists = await socialRepository.listPublicPlaylists();
  return <div className="min-h-screen bg-background text-foreground"><PublicHeader /><main className="page-shell"><section className="panel p-7 md:p-10"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Radarune listeleri</p><h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">Müziği listelerden keşfet.</h1><p className="mt-4 max-w-2xl text-muted">En çok oy alan, en fazla dinlenen ve global listelerdeki gerçek yayınları tek yerde takip et.</p></section><section className="grid gap-4 md:grid-cols-3">{curated.map((item) => { const playlist = playlists.find((entry) => entry.slug === item.slug); return <article className="panel flex min-h-56 flex-col p-6" key={item.slug}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Liste</p><h2 className="mt-3 text-2xl font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{item.description}</p><div className="mt-auto pt-6">{playlist ? <Link className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href={`/playlist/${playlist.slug}`}>Listeyi aç · {playlist.tracks.length} parça</Link> : <p className="rounded-xl border border-dashed border-line px-3 py-2 text-sm text-muted">Henüz yayın eklenmedi.</p>}</div></article>; })}</section><section className="panel p-6 md:p-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Topluluk</p><h2 className="mt-2 text-2xl font-semibold">Diğer public listeler</h2></div><p className="text-sm text-muted">Listeler admin panelinden düzenlenir.</p></div><div className="mt-5 grid gap-3 md:grid-cols-2">{playlists.filter((playlist) => !curated.some((item) => item.slug === playlist.slug)).map((playlist) => <Link className="rounded-2xl border border-line p-4 transition hover:border-accent" href={`/playlist/${playlist.slug ?? playlist.id}`} key={playlist.id}><p className="font-semibold">{playlist.name}</p><p className="mt-1 text-sm text-muted">{playlist.tracks.length} parça · {playlist.ownerUser.name}</p></Link>)}{playlists.length === 0 ? <p className="text-sm text-muted">Henüz public liste bulunmuyor.</p> : null}</div></section></main><PublicFooter /></div>;
}
