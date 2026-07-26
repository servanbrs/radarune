import "server-only";
import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";

export async function getGrowthActor() {
  const { organization, user } = await authSessionService.getDashboardContext();
  return toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
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
