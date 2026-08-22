import "server-only";
import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { prisma } from "@/server/prisma/prisma";

export async function getGrowthActor() {
  const session = await authSessionService.getRequiredSession();
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      organizationId: true,
      role: true,
      user: {
        select: {
          emailVerified: true,
          systemRole: true,
        },
      },
    },
  });

  // Existing users normally have an active membership. Keep the slower
  // self-healing path only for old accounts whose workspace is missing.
  if (!membership) {
    const { organization, user } = await authSessionService.getDashboardContext();
    return toAdminActor({
      organizationId: organization.organization.id,
      membershipRole: organization.role,
      systemRole: user.systemRole,
      userId: user.id,
    });
  }

  if (!membership.user.emailVerified) {
    throw new Error("Yorum yapmak için e-posta adresinizi doğrulayın.");
  }

  return toAdminActor({
    organizationId: membership.organizationId,
    membershipRole: membership.role,
    systemRole: membership.user.systemRole,
    userId: session.user.id,
  });
}

export function growthJsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "Growth işlemi başarısız oldu.";
  const status = message.includes("yetkiniz")
    ? 403
    : message.includes("bulunamadı")
      ? 404
      : message.includes("sık işlem")
        ? 429
        : 422;
  return NextResponse.json({ error: message }, { status });
}
