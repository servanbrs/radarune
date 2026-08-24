import "server-only";
import { artistRepository } from "@/features/artist/server/repositories/artist.repository";
import { rbacService } from "@/features/authorization/server/rbac";

export type FinanceActorContext = {
  membershipRole: "OWNER" | "ADMIN" | "MEMBER";
  organizationId: string;
  systemRole: "USER" | "ARTIST" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  userId: string;
};

export class FinanceAccessService {
  canViewAllFinance(context: FinanceActorContext) {
    return rbacService.hasEffectivePermission({
      membershipRole: context.membershipRole,
      permission: "analytics:view:all",
      systemRole: context.systemRole,
    });
  }

  canViewLabelFinance(context: FinanceActorContext) {
    return (
      this.canViewAllFinance(context) ||
      rbacService.hasEffectivePermission({
        membershipRole: context.membershipRole,
        permission: "analytics:view:label",
        systemRole: context.systemRole,
      })
    );
  }

  async listAccessibleArtistIds(context: FinanceActorContext) {
    if (this.canViewLabelFinance(context)) {
      return null;
    }

    const artists = await artistRepository.listFinanceAccessibleArtistIdsByUserId(
      context.organizationId,
      context.userId,
    );

    return artists.map((artist) => artist.id);
  }
}

export const financeAccessService = new FinanceAccessService();
