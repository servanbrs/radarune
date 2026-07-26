import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { canAccessAdmin, toAdminActor } from "@/features/admin/server/admin-context";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  if (!canAccessAdmin(actor)) {
    redirect("/dashboard");
  }

  return children;
}
