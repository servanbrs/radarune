import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  eyebrow: string;
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
  children: ReactNode;
};

export function AuthShell({
  children,
  description,
  eyebrow,
  footerHref,
  footerLinkLabel,
  footerText,
  title,
}: AuthShellProps) {
  return (
    <main className="page-shell items-stretch bg-[#080f13] text-white">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel relative overflow-hidden border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(68,199,173,0.22),transparent_35%),#111d20] px-8 py-10 text-white md:px-12 md:py-12">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f766e,#ff9357,#0f766e)]" />
          <div className="flex h-full flex-col justify-between gap-12">
            <div className="max-w-2xl space-y-6">
              <span className="inline-flex rounded-full border border-accent/20 bg-accent/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                {eyebrow}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl leading-tight font-semibold md:text-6xl">
                  Müzik operasyonu, hak verisi ve dağıtım tek kontrol merkezinde.
                </h1>
                <p className="max-w-xl text-base leading-8 text-muted md:text-lg">
                  Radarune; yayın hazırlığı, dağıtım yönetimi ve provider akışını
                  dağınık tablolar yerine tek bir üretim alanında toplar.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  Sağlayıcılar
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">5 adaptör</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  Metadata
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">ISRC / UPC uyumlu</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  Architecture
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">Temiz, modüler</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel flex items-center border-white/10 bg-[#111d20] px-6 py-8 text-white md:px-10">
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
            <p className="text-sm text-muted">
              {footerText}{" "}
              <Link className="font-semibold text-accent hover:text-accent/80" href={footerHref}>
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
