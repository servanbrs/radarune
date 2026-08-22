import Link from "next/link";

import { VerifyLoginOtpForm } from "@/features/authentication/components/verify-login-otp-form";
import { getRequestLocale } from "@/lib/i18n-server";

export default async function VerifyLoginPage() {
  const locale = await getRequestLocale();
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <Link
          className="mb-8 text-sm font-semibold uppercase tracking-[0.24em] text-accent"
          href="/"
        >
          Radarune
        </Link>

        <VerifyLoginOtpForm locale={locale} />
      </div>
    </main>
  );
}
