import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { CreateOrganizationForm } from "@/features/organization/components/create-organization-form";
import { organizationService } from "@/features/organization/server/services/organization.service";

export default async function OrganizationOnboardingPage() {
  const session = await authSessionService.getRequiredSession();
  const organization = await organizationService.getOptionalOrganizationContext(
    session.user.id,
  );

  if (organization) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="Create the first organization workspace. This becomes the tenant boundary for labels, artists, releases, and permissions."
      eyebrow="Organization setup"
      footerHref="/dashboard"
      footerLinkLabel="Go to dashboard"
      footerText="Already set up?"
      title="Create your workspace"
    >
      <CreateOrganizationForm />
    </AuthShell>
  );
}
