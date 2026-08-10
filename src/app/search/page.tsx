import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { MobileSearchPage } from "@/features/growth/components/mobile-search-page";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müzik ve sanatçı ara | Radarune",
  description:
    "Radarune’de sanatçıları, şarkıları, yayınları ve albümleri ara; yeni müzikleri keşfet.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Müzik ve sanatçı ara | Radarune",
    description: "Radarune kataloğunda yeni müzikleri ve sanatçıları bul.",
    url: "/search",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await authSessionService.getOptionalSession();
  const params = await searchParams;
  const currentUser = session ? { name: session.user.name, username: "username" in session.user && typeof session.user.username === "string" ? session.user.username : null } : null;
  return <PublicGrowthShell currentUser={currentUser}><MobileSearchPage initialQuery={params.q ?? ""} /></PublicGrowthShell>;
}
