import Link from "next/link";

import { VerifyEmailOtpForm } from "@/features/authentication/components/verify-email-otp-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const email = params.email?.trim() ?? "";

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <Link
          className="mb-8 text-sm font-semibold uppercase tracking-[0.24em] text-accent"
          href="/"
        >
          Radarune
        </Link>

        <VerifyEmailOtpForm initialEmail={email} />

        <Link
          className="mt-6 text-sm font-medium text-muted hover:text-foreground"
          href="/sign-in"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    </main>
  );
}
