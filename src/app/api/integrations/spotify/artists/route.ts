import { NextResponse } from "next/server";
import { financeActorService } from "@/features/finance/server/services/finance-actor.service";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";

export async function GET(request: Request) {
  const actor = await financeActorService.getOptionalRouteActor();
  if (!actor) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ items: [] });

  const credentials = await integrationCredentialService.runtime(actor.organizationId, "SPOTIFY");
  const result = await spotifyProviderService.searchArtists(query, credentials?.clientId && credentials.clientSecret ? credentials : undefined);
  if (!result.success) return NextResponse.json({ error: result.message, code: result.code }, { status: result.code === "CONFIGURATION_REQUIRED" ? 503 : 502 });

  const items = (result.data.artists?.items ?? []).flatMap((artist) => {
    if (!artist.id || !artist.name) return [];
    return [{ id: artist.id, name: artist.name, url: artist.external_urls?.spotify ?? `https://open.spotify.com/artist/${artist.id}`, imageUrl: artist.images?.[0]?.url ?? null, followers: artist.followers?.total ?? 0, popularity: artist.popularity ?? 0, provider: "SPOTIFY" as const }];
  });
  return NextResponse.json({ items });
}
