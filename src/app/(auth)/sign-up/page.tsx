import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { SignUpForm } from "@/features/authentication/components/sign-up-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

export default async function SignUpPage() {
  const session = await authSessionService.getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="Create the first Radarune workspace user and establish the authentication layer for the platform."
      eyebrow="Platform onboarding"
      footerHref="/sign-in"
      footerLinkLabel="Sign in"
      footerText="Already onboarded?"
      title="Create account"
    >
      <SignUpForm />
    </AuthShell>
  );
}
