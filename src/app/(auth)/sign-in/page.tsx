import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { SignInForm } from "@/features/authentication/components/sign-in-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

export default async function SignInPage() {
  const session = await authSessionService.getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="Access your release operations workspace, provider routing controls, and catalog governance tools."
      eyebrow="Radarune access"
      footerHref="/sign-up"
      footerLinkLabel="Create account"
      footerText="No account yet?"
      title="Sign in"
    >
      <SignInForm />
    </AuthShell>
  );
}
