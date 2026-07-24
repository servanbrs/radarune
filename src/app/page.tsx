import { redirect } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { organizationService } from "@/features/organization/server/services/organization.service";

export default async function HomePage() {
  const session = await authSessionService.getOptionalSession();

  if (!session) {
    redirect("/sign-in");
  }

  const organization = await organizationService.getOptionalOrganizationContext(
    session.user.id,
  );

  redirect(organization ? "/dashboard" : "/onboarding/organization");
}
