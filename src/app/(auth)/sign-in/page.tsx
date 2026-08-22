import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { SignInForm } from "@/features/authentication/components/sign-in-form";
import { safeRedirectPath } from "@/features/authentication/lib/safe-redirect";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { getSocialProviderAvailability } from "@/features/authentication/server/social-provider-configuration.service";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Giriş yap, aramıza katıl | Radarune",
  description:
    "Radarune hesabınıza giriş yapın; yeni müzikleri keşfedin, sanatçıları takip edin ve yayın operasyonunuzu yönetin.",
  alternates: { canonical: "/sign-in" },
  openGraph: {
    title: "Giriş yap, aramıza katıl | Radarune",
    description:
      "Radarune topluluğuna katılın, müziği keşfedin ve yayın operasyonunuzu tek merkezden yönetin.",
    url: "/sign-in",
    type: "website",
  },
  robots: { index: true, follow: true },
};

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
  const locale = await getRequestLocale();

  return (
    <AuthShell
      description={t(locale, "signInDescription")}
      eyebrow={t(locale, "signInEyebrow")}
      footerHref="/sign-up"
      footerLinkLabel={t(locale, "createAccount")}
      footerText={t(locale, "signInFooterText")}
      title={t(locale, "signInTitle")}
      locale={locale}
    >
      <SignInForm
        googleEnabled={socialProviders.google}
        facebookEnabled={socialProviders.facebook}
        nextPath={nextPath}
        locale={locale}
      />
    </AuthShell>
  );
}
