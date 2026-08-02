import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { SignInForm } from "@/features/authentication/components/sign-in-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { env } from "@/lib/env";

export default async function SignInPage() {
  const session = await authSessionService.getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      description="Yayın operasyonu çalışma alanınıza, provider yönlendirmelerine ve katalog yönetim araçlarına erişin."
      eyebrow="Radarune erişimi"
      footerHref="/sign-up"
      footerLinkLabel="Hesap oluştur"
      footerText="Henüz hesabınız yok mu?"
      title="Giriş yap"
    >
      <SignInForm googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)} />
    </AuthShell>
  );
}
