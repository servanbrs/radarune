import "server-only";
import { rbacService } from "@/features/authorization/server/rbac";
import { artistRepository } from "@/features/artist/server/repositories/artist.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export type ReleaseActor = FinanceActorContext & {
  email?: string;
  name?: string;
};

export class ReleaseAccessService {
  canViewAll(actor: ReleaseActor) {
    return ["ADMIN", "SUPER_ADMIN"].includes(actor.systemRole);
  }

  canManageSubmitted(actor: ReleaseActor) {
    return rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      systemRole: actor.systemRole,
      permission: "releases:review",
    });
  }

  canDistribute(actor: ReleaseActor) {
    return rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      systemRole: actor.systemRole,
      permission: "releases:distribute",
    });
  }

  async assertCanCreateRelease(actor: ReleaseActor) {
    if (["ADMIN", "SUPER_ADMIN"].includes(actor.systemRole)) {
      return;
    }

    const artists = await artistRepository.listOwnedArtistIdsByUserId(actor.userId);
    const ownsArtistInOrganization = artists.length > 0;

    if (!ownsArtistInOrganization) {
      throw new Error("Yeni yayın oluşturmak için onaylı sanatçı profiline sahip olmalısınız.");
    }
  }

  assertCanEditRelease(actor: ReleaseActor, release: { createdByUserId: string; organizationId: string; status: string }) {
    this.assertCanViewRelease(actor, release);

    if (this.canManageSubmitted(actor)) {
      return;
    }

    if (!["DRAFT", "REVISION_REQUESTED"].includes(release.status)) {
      throw new Error("İncelemeye gönderilmiş yayınlar kullanıcı tarafından düzenlenemez.");
    }
  }

  assertCanViewRelease(actor: ReleaseActor, release: { createdByUserId: string; organizationId: string; status: string }) {
    if (release.organizationId !== actor.organizationId && !this.canViewAll(actor)) {
      throw new Error("Bu yayını görüntüleme yetkiniz yok.");
    }

    if (this.canManageSubmitted(actor)) {
      return;
    }

    if (release.createdByUserId !== actor.userId) {
      throw new Error("Bu yayını görüntüleme yetkiniz yok.");
    }
  }
}

export const releaseAccessService = new ReleaseAccessService();
