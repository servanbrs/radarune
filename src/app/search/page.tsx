import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { MobileSearchPage } from "@/features/growth/components/mobile-search-page";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";

export const metadata = { title: "Ara | Radarune", description: "Radarune sanatçı, yayın ve şarkı araması." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await authSessionService.getOptionalSession();
  const params = await searchParams;
  const currentUser = session ? { name: session.user.name, username: "username" in session.user && typeof session.user.username === "string" ? session.user.username : null } : null;
  return <PublicGrowthShell currentUser={currentUser}><MobileSearchPage initialQuery={params.q ?? ""} /></PublicGrowthShell>;
}
