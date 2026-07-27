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
      description="Radarune hesabınızı oluşturun, yeni müzikleri keşfedin ve sanatçı başvurunuzu yönetin."
      eyebrow="Radarune üyeliği"
      footerHref="/sign-in"
      footerLinkLabel="Giriş yap"
      footerText="Zaten hesabınız var mı?"
      title="Hesap oluştur"
    >
      <SignUpForm />
    </AuthShell>
  );
}
