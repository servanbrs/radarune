import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, LockKeyhole, Sparkles } from "lucide-react";
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
    <div className={`auth-shell auth-shell-${mode} min-h-screen pb-24 lg:pb-0`}>
      <PublicAuthHeader mode={mode} locale={activeLocale} />
      <main className="auth-main page-shell items-stretch">
        <div className="auth-layout grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="auth-hero panel relative hidden overflow-hidden px-8 py-10 md:px-12 md:py-12 lg:block">
            <div aria-hidden="true" className="auth-orbit auth-orbit-one" />
            <div aria-hidden="true" className="auth-orbit auth-orbit-two" />
            <div aria-hidden="true" className="auth-glow auth-glow-one" />
            <div aria-hidden="true" className="auth-glow auth-glow-two" />
            <div className="auth-hero-content flex h-full flex-col justify-between gap-12">
              <div className="max-w-2xl space-y-7">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  <span className="auth-live-dot" />
                  <span>{eyebrow}</span>
                </div>
                <div className="space-y-5">
                  <div className="auth-mark inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-white shadow-2xl backdrop-blur-md">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[#55ddbd] text-[#071513]">
                      <Sparkles className="size-5" />
                    </span>
                    <span className="text-sm font-semibold tracking-[0.18em]">RADARUNE</span>
                  </div>
                  <h1 className="max-w-2xl text-4xl leading-[1.06] font-semibold tracking-[-0.04em] md:text-6xl">
                    {t(activeLocale, "authHeroTitle")}
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-white/70 md:text-lg">
                    {t(activeLocale, "authHeroDescription")}
                  </p>
                </div>
                <div className="auth-hero-note flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/70 backdrop-blur-sm">
                  <LockKeyhole className="size-4 shrink-0 text-[#55ddbd]" />
                  <span>{t(activeLocale, "accountSecurity")}</span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="auth-stat rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">{t(activeLocale, "authProviders")}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">5 adaptör</p>
                </div>
                <div className="auth-stat rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">{t(activeLocale, "authMetadata")}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">ISRC / UPC</p>
                </div>
                <div className="auth-stat rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">{t(activeLocale, "authArchitecture")}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{t(activeLocale, "authCleanModular")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-form-panel panel auth-form-card flex items-center px-5 py-7 sm:px-6 sm:py-8 md:px-10">
            <div className="mx-auto flex w-full max-w-md flex-col gap-8">
              <div className="auth-form-heading space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
                  <span className="auth-private-badge inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-accent">
                    <LockKeyhole className="size-3" /> private
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold">{title}</h2>
                  <p className="text-sm leading-7 text-muted">{description}</p>
                </div>
              </div>
              {children}
              <p className="auth-form-footer text-sm text-muted">
                {footerText}{" "}
                <Link className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent/80" href={footerHref}>
                  {footerLinkLabel}<ArrowUpRight className="size-3.5" />
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
