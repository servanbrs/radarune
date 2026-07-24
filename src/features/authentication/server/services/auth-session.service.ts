import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/features/authentication/server/auth";
import { organizationService } from "@/features/organization/server/services/organization.service";
import { userAuthRepository } from "@/features/authentication/server/repositories/user-auth.repository";

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

  async getDashboardContext() {
    const session = await this.getRequiredSession();
    const user = await userAuthRepository.findDashboardUserById(session.user.id);
    const organization = await organizationService.getRequiredOrganizationContext(
      session.user.id,
    );

    if (!user) {
      redirect("/sign-in");
    }

    return {
      organization,
      session,
      user,
    };
  }
}

export const authSessionService = new AuthSessionService();
