import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { SignUpForm } from "@/features/authentication/components/sign-up-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { getSocialProviderAvailability } from "@/features/authentication/server/social-provider-configuration.service";

export const metadata: Metadata = {
  title: "Aramıza katıl | Radarune",
  description:
    "Radarune’de ücretsiz hesap oluşturun; yeni müzikleri keşfedin, sanatçıları takip edin ve kendi yayınınızı hazırlayın.",
  alternates: { canonical: "/sign-up" },
  openGraph: {
    title: "Aramıza katıl | Radarune",
    description:
      "Radarune topluluğuna ücretsiz katılın ve müziğinizi daha görünür hale getirin.",
    url: "/sign-up",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function SignUpPage() {
  const session = await authSessionService.getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }
  const socialProviders = await getSocialProviderAvailability();

  return (
    <AuthShell
      description="Radarune hesabınızı oluşturun, yeni müzikleri keşfedin ve sanatçı başvurunuzu yönetin."
      eyebrow="Radarune üyeliği"
      footerHref="/sign-in"
      footerLinkLabel="Giriş yap"
      footerText="Zaten hesabınız var mı?"
      title="Hesap oluştur"
    >
      <SignUpForm googleEnabled={socialProviders.google} facebookEnabled={socialProviders.facebook} />
    </AuthShell>
  );
}
