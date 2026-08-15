import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/features/authentication/server/auth";
import { organizationService } from "@/features/organization/server/services/organization.service";
import { userAuthRepository } from "@/features/authentication/server/repositories/user-auth.repository";

type DashboardUser = NonNullable<
  Awaited<ReturnType<typeof userAuthRepository.findDashboardUserById>>
>;
type DashboardOrganizationContext = Awaited<
  ReturnType<typeof organizationService.ensurePersonalOrganizationContext>
>;
type DashboardSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

const getDashboardContext = cache(async (): Promise<{
  organization: DashboardOrganizationContext;
  session: DashboardSession;
  user: DashboardUser;
}> => {
  const session = await getSession();

  if (!session) redirect("/sign-in");

  const dashboardUser = await userAuthRepository.findDashboardUserById(session.user.id);
  if (!dashboardUser) redirect("/sign-in");
  if (!dashboardUser.emailVerified) redirect(`/verify-email?email=${encodeURIComponent(dashboardUser.email)}`);

  const organization = await organizationService.ensurePersonalOrganizationContext(dashboardUser.id, dashboardUser.name);
  return { organization, session, user: dashboardUser };
});

const getSession = cache(async () => {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? "";

  // Public pages are also rendered through the shared app layout. Avoid a
  // remote database round-trip for anonymous visitors; Better Auth cannot
  // have a session when the session cookie is absent.
  const hasSessionCookie = /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(cookieHeader);
  if (!hasSessionCookie) return null;

  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch (error) {
    // A transient remote database failure must not crash the shared app
    // layout. Protected pages will redirect to sign-in; public pages can
    // continue rendering while the database connection recovers.
    console.error("[AUTH_SESSION] Oturum okunamadı:", error);
    return null;
  }
});

class AuthSessionService {
  async getOptionalSession() {
    return getSession();
  }

  async getRequiredSession() {
    const session = await getSession();

    if (!session) {
      redirect("/sign-in");
    }

    return session;
  }

  async getDashboardContext(): Promise<{
    organization: DashboardOrganizationContext;
    session: DashboardSession;
    user: DashboardUser;
  }> {
    return getDashboardContext();
  }
}

export const authSessionService = new AuthSessionService();
