import type { ReactNode } from "react";
import { headers } from "next/headers";

import {
  canAccessAdmin,
  canAccessModeratorPath,
  toAdminActor,
} from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { AdminThemeBridge } from "@/features/admin/components/admin-theme-bridge";
import { AdminAccessDenied } from "@/features/admin/components/admin-access-denied";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";

async function recordAdminAccessAttempt(reason: string) {
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = forwarded || requestHeaders.get("x-real-ip") || "unknown";
    await auditLogService.create({
      action: "ADMIN_ACCESS_ATTEMPT",
      entityType: "AdminAccess",
      metadata: {
        ipAddress,
        reason,
        userAgent: requestHeaders.get("user-agent") ?? "unknown",
        path: requestHeaders.get("x-invoke-path") ?? "/admin",
      },
    });
  } catch (error) {
    console.error("[ADMIN_ACCESS] Erişim denemesi kaydedilemedi", error);
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const optionalSession = await authSessionService.getOptionalSession();

  if (!optionalSession) {
    await recordAdminAccessAttempt("Giriş yapılmamış erişim denemesi");
    return <AdminAccessDenied />;
  }

  const { organization, user } = await authSessionService.getDashboardContext();

  if (user.accountStatus !== "ACTIVE") {
    await recordAdminAccessAttempt("Pasif hesapla erişim denemesi");
    return <AdminAccessDenied />;
  }

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-radarune-path")
    ?? requestHeaders.get("x-invoke-path")
    ?? requestHeaders.get("next-url")
    ?? requestHeaders.get("x-matched-path")
    ?? "/admin";
  if (!canAccessAdmin(actor) && !canAccessModeratorPath(actor, pathname.split("?")[0] ?? "/admin")) {
    await recordAdminAccessAttempt("Yetkisiz kullanıcı erişim denemesi");
    return <AdminAccessDenied />;
  }

  return <><AdminThemeBridge />{children}</>;
}
