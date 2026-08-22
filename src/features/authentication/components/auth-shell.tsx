import Link from "next/link";
import type { ReactNode } from "react";
import { PublicFooter } from "@/components/public-footer";
import { PublicAuthHeader } from "@/features/authentication/components/public-auth-header";
import { MobileBottomNav } from "@/features/platform/components/mobile-bottom-nav";
import { getRequestLocale } from "@/lib/i18n-server";
import { normalizeLocale, t } from "@/lib/i18n";

type AuthShellProps = {
  title: string;
  description: string;
  eyebrow: string;
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
  children: ReactNode;
  locale?: string;
};

export async function AuthShell({
  children,
  description,
  eyebrow,
  footerHref,
  footerLinkLabel,
  footerText,
  title,
  locale,
}: AuthShellProps) {
  const mode = footerHref === "/sign-up" ? "sign-in" : "sign-up";
  const activeLocale = normalizeLocale(locale ?? (await getRequestLocale()));

  return (
    <div className="auth-shell min-h-screen pb-24 lg:pb-0">
      <PublicAuthHeader mode={mode} locale={activeLocale} />
      <main className="auth-main page-shell items-stretch">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="auth-hero panel relative hidden overflow-hidden px-8 py-10 md:px-12 md:py-12 lg:block">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f766e,#ff9357,#0f766e)]" />
            <div className="flex h-full flex-col justify-between gap-12">
              <div className="max-w-2xl space-y-6">
                <span className="inline-flex rounded-full border border-accent/20 bg-accent/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  {eyebrow}
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-xl text-4xl leading-tight font-semibold md:text-6xl">
                    {t(activeLocale, "authHeroTitle")}
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-white/70 md:text-lg">
                    {t(activeLocale, "authHeroDescription")}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                    {t(activeLocale, "authProviders")}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">5 adaptör</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    {t(activeLocale, "authMetadata")}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">ISRC / UPC uyumlu</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    {t(activeLocale, "authArchitecture")}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">{t(activeLocale, "authCleanModular")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-form-panel panel flex items-center px-5 py-7 sm:px-6 sm:py-8 md:px-10">
            <div className="mx-auto flex w-full max-w-md flex-col gap-8">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                  {eyebrow}
                </p>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold">{title}</h2>
                  <p className="text-sm leading-7 text-muted">{description}</p>
                </div>
              </div>
              {children}
              <p className="text-sm text-white/65">
                {footerText}{" "}
                <Link className="font-semibold text-accent hover:text-accent/80" href={footerHref}>
                  {footerLinkLabel}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter locale={activeLocale} />
      <MobileBottomNav
        locale={activeLocale}
        homeHref="/"
        profileHref="/sign-in"
        profileLabel={t(activeLocale, "login")}
      />
    </div>
  );
}
