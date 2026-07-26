import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import { userProfileService } from "@/features/users/server/services/user-profile.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const result = await userProfileService.getPublicProfile(username.toLowerCase());
  return { title: result.profile ? `${result.profile.name} | Radarune` : "Kullanıcı profili | Radarune", robots: { index: Boolean(result.profile), follow: Boolean(result.profile) } };
}

export default async function PublicUserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const result = await userProfileService.getPublicProfile(username.toLowerCase());
  if (result.redirectTo) permanentRedirect(`/u/${result.redirectTo}`);
  if (!result.profile) notFound();
  return <main className="min-h-screen bg-background px-6 py-16 text-foreground"><section className="panel mx-auto max-w-xl p-8"><p className="text-xs uppercase tracking-[0.24em] text-muted">Kullanıcı profili</p><h1 className="mt-3 text-3xl font-semibold">{result.profile.name}</h1><p className="mt-2 text-sm text-muted">@{result.profile.username}</p></section></main>;
}
