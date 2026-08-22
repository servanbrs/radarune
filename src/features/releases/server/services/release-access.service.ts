import "server-only";

import type { ArtistTeamRole } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { rbacService } from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export type ReleaseActor = FinanceActorContext & {
  email?: string;
  name?: string;
};

const EDITABLE_ARTIST_TEAM_ROLES: ArtistTeamRole[] = [
  "OWNER",
  "MANAGER",
  "EDITOR",
];

export class ReleaseAccessService {
  canViewAll(actor: ReleaseActor) {
    return ["ADMIN", "SUPER_ADMIN"].includes(
      actor.systemRole,
    );
  }

  canManageSubmitted(actor: ReleaseActor) {
    return rbacService.hasSystemPermission(
      actor.systemRole,
      "releases:review",
    );
  }

  canDistribute(actor: ReleaseActor) {
    return rbacService.hasSystemPermission(
      actor.systemRole,
      "releases:distribute",
    );
  }

  async listManageableArtistIds(
    actor: ReleaseActor,
  ): Promise<string[]> {
    if (this.canViewAll(actor)) {
      const artists = await prisma.artist.findMany({
        where: {
          organizationId: actor.organizationId,
        },
        select: {
          id: true,
        },
      });

      return artists.map((artist) => artist.id);
    }

    const artists = await prisma.artist.findMany({
      where: {
        organizationId: actor.organizationId,
        OR: [
          {
            ownerUserId: actor.userId,
          },
          {
            teamMembers: {
              some: {
                userId: actor.userId,
                role: {
                  in: EDITABLE_ARTIST_TEAM_ROLES,
                },
              },
            },
          },
          {
            labelLinks: {
              some: { label: { organizationId: actor.organizationId } },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    return artists.map((artist) => artist.id);
  }

  async assertCanCreateRelease(actor: ReleaseActor) {
    if (this.canViewAll(actor)) {
      return;
    }

    const manageableArtistIds =
      await this.listManageableArtistIds(actor);

    if (manageableArtistIds.length === 0) {
      throw new Error(
        "Yayın oluşturabilmek için onaylı bir sanatçı profiline sahip olmalı veya bir sanatçının yönetici ekibinde OWNER, MANAGER ya da EDITOR olarak bulunmalısınız.",
      );
    }
  }

  assertCanEditRelease(
    actor: ReleaseActor,
    release: {
      createdByUserId: string;
      organizationId: string;
      status: string;
    },
  ) {
    this.assertCanViewRelease(actor, release);

    if (this.canManageSubmitted(actor)) {
      return;
    }

    if (
      !["DRAFT", "REVISION_REQUESTED"].includes(
        release.status,
      )
    ) {
      throw new Error(
        "İncelemeye gönderilmiş yayınlar kullanıcı tarafından düzenlenemez.",
      );
    }
  }

  assertCanEditSupplementalRelease(
    actor: ReleaseActor,
    release: {
      createdByUserId: string;
      organizationId: string;
      status: string;
    },
  ) {
    this.assertCanViewRelease(actor, release);

    if (this.canManageSubmitted(actor) || release.createdByUserId === actor.userId) {
      return;
    }

    throw new Error("Bu yayının ek medya ve kodlarını düzenleme yetkiniz yok.");
  }

  assertCanViewRelease(
    actor: ReleaseActor,
    release: {
      createdByUserId: string;
      organizationId: string;
      status: string;
    },
  ) {
    if (
      release.organizationId !== actor.organizationId &&
      !this.canViewAll(actor)
    ) {
      throw new Error(
        "Bu yayını görüntüleme yetkiniz yok.",
      );
    }

    if (this.canManageSubmitted(actor)) {
      return;
    }

    if (release.createdByUserId !== actor.userId) {
      throw new Error(
        "Bu yayını görüntüleme yetkiniz yok.",
      );
    }
  }
}

export const releaseAccessService =
  new ReleaseAccessService();
