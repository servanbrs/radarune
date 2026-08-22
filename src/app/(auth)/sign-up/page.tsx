import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { SignUpForm } from "@/features/authentication/components/sign-up-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { getSocialProviderAvailability } from "@/features/authentication/server/social-provider-configuration.service";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

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
  const locale = await getRequestLocale();

  return (
    <AuthShell
      description={t(locale, "signUpDescription")}
      eyebrow={t(locale, "signUpEyebrow")}
      footerHref="/sign-in"
      footerLinkLabel={t(locale, "login")}
      footerText={t(locale, "signUpFooterText")}
      title={t(locale, "signUpTitle")}
      locale={locale}
    >
      <SignUpForm googleEnabled={socialProviders.google} facebookEnabled={socialProviders.facebook} locale={locale} />
    </AuthShell>
  );
}
