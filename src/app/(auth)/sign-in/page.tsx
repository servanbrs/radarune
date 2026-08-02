import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { SignInForm } from "@/features/authentication/components/sign-in-form";
import { safeRedirectPath } from "@/features/authentication/lib/safe-redirect";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { getSocialProviderAvailability } from "@/features/authentication/server/social-provider-configuration.service";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = safeRedirectPath(
    typeof params?.next === "string" ? params.next : undefined,
  );
  const session = await authSessionService.getOptionalSession();

  if (session) {
    redirect(nextPath);
  }
  const socialProviders = await getSocialProviderAvailability();

  return (
    <AuthShell
      description="Yayın operasyonu çalışma alanınıza, provider yönlendirmelerine ve katalog yönetim araçlarına erişin."
      eyebrow="Radarune erişimi"
      footerHref="/sign-up"
      footerLinkLabel="Hesap oluştur"
      footerText="Henüz hesabınız yok mu?"
      title="Giriş yap"
    >
      <SignInForm
        googleEnabled={socialProviders.google}
        facebookEnabled={socialProviders.facebook}
        nextPath={nextPath}
      />
    </AuthShell>
  );
}
