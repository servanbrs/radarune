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

const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
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
    const session = await this.getRequiredSession();
    const dashboardUser = await userAuthRepository.findDashboardUserById(
      session.user.id,
    );

    if (!dashboardUser) {
      redirect("/sign-in");
    }

    if (!dashboardUser.emailVerified) {
      redirect(
        `/verify-email?email=${encodeURIComponent(dashboardUser.email)}`,
      );
    }

    const organization =
      await organizationService.ensurePersonalOrganizationContext(
        dashboardUser.id,
        dashboardUser.name,
      );

    return {
      organization,
      session,
      user: dashboardUser,
    };
  }
}

export const authSessionService = new AuthSessionService();
