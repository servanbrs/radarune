import "server-only";
import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";

export async function getAdminActor() {
  const { organization, user } = await authSessionService.getDashboardContext();
  return toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
}

export function adminJsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "Admin işlemi başarısız oldu.";
  const status =
    message.includes("yetkiniz") || message.includes("erişim")
      ? 403
      : message.includes("bulunamadı")
        ? 404
        : message.includes("Geçersiz")
          ? 409
          : 422;

  return NextResponse.json({ error: message }, { status });
}
