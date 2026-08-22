import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { ArtistChannelAnalytics } from "@/features/artist/components/artist-channel-analytics";

type ArtistProfileAnalyticsPageProps = {
  searchParams?: Promise<{ artistId?: string }>;
};

export default async function ArtistProfileAnalyticsPage({ searchParams }: ArtistProfileAnalyticsPageProps) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const params = searchParams ? await searchParams : {};
  const actor = {
    organizationId: organization.organization.id,
    userId: user.id,
    systemRole: user.systemRole,
  };

  return (
    <main className="page-shell">
      <Link className="text-sm font-semibold text-accent hover:underline" href="/artist-profile">← Sanatçı kanallarım</Link>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Creator analytics</p>
        <h1 className="mt-2 text-3xl font-semibold">Kanal analizleri</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Kanalını kaç kişinin gördüğünü, yayınlarının kaç kez dinlendiğini ve topluluk etkileşimini tek görünümde takip et.</p>
      </div>
      <ArtistChannelAnalytics actor={actor} artistId={params.artistId} />
    </main>
  );
}
