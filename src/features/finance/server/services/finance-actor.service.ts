import "server-only";
import { headers } from "next/headers";
import { auth } from "@/features/authentication/server/auth";
import { userAuthRepository } from "@/features/authentication/server/repositories/user-auth.repository";
import { organizationRepository } from "@/features/organization/server/repositories/organization.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

type FinanceRouteActor = FinanceActorContext & {
  email: string;
  name: string;
};

export class FinanceActorService {
  async getOptionalRouteActor(): Promise<FinanceRouteActor | null> {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return null;
    }

    const [membership, user] = await Promise.all([
      organizationRepository.findPrimaryMembershipByUserId(session.user.id),
      userAuthRepository.findDashboardUserById(session.user.id),
    ]);

    if (!membership || !user) {
      return null;
    }

    return {
      organizationId: membership.organization.id,
      membershipRole: membership.role,
      systemRole: user.systemRole,
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  }
}

export const financeActorService = new FinanceActorService();
