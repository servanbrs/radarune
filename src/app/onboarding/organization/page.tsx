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
      description="Sanatçı, label, yayın ve dağıtım operasyonlarınızı güvenli bir çalışma alanında başlatın."
      eyebrow="Çalışma alanı kurulumu"
      footerHref="/sign-in"
      footerLinkLabel="Giriş sayfasına dön"
      footerText="Hesabınız var mı?"
      title="Çalışma alanınızı oluşturun"
    >
      <CreateOrganizationForm />
    </AuthShell>
  );
}
