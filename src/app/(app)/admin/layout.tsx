import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  canAccessAdmin,
  toAdminActor,
} from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  if (user.accountStatus !== "ACTIVE") {
    redirect("/sign-in");
  }

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  if (!canAccessAdmin(actor)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}