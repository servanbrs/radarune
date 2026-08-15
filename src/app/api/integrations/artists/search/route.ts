import { NextResponse } from "next/server";
import { financeActorService } from "@/features/finance/server/services/finance-actor.service";

export async function GET(request: Request) {
  const actor = await financeActorService.getOptionalRouteActor();
  if (!actor) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const query = params.get("query")?.trim() ?? "";
  const provider = params.get("provider") ?? "deezer";
  if (query.length < 2 || !["deezer", "itunes"].includes(provider)) return NextResponse.json({ items: [] });

  try {
    const url = provider === "deezer"
      ? `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=8`
      : `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=8`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: `${provider} araması başarısız oldu.` }, { status: 502 });
    const payload = await response.json() as { data?: Array<Record<string, unknown>>; results?: Array<Record<string, unknown>> };
    const source = provider === "deezer" ? payload.data ?? [] : payload.results ?? [];
    const items = source.flatMap((item) => {
      const name = provider === "deezer" ? item.name : item.artistName;
      const urlValue = provider === "deezer" ? item.link : item.artistLinkUrl;
      const id = provider === "deezer" ? item.id : item.artistId;
      if (typeof name !== "string" || typeof urlValue !== "string" || (typeof id !== "string" && typeof id !== "number")) return [];
      return [{ id: String(id), name, url: urlValue, imageUrl: typeof (provider === "deezer" ? item.picture_medium : item.artworkUrl100) === "string" ? (provider === "deezer" ? item.picture_medium : item.artworkUrl100) as string : null, provider }];
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: `${provider} sanatçıları aranamadı.` }, { status: 502 });
  }
}
