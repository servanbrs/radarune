import Link from "next/link";

import { ErrorRecoveryActions } from "@/components/error-recovery-actions";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-background px-4 py-16 text-foreground">
      <section className="w-full max-w-xl rounded-[2rem] border border-line bg-surface p-8 shadow-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          404 · Radarune
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sayfa bulunamadı</h1>
        <p className="mt-3 leading-7 text-muted">
          Aradığınız sayfa taşınmış veya kaldırılmış olabilir.
        </p>
        <ErrorRecoveryActions />
        <Link
          className="mt-5 inline-flex text-sm font-semibold text-accent hover:underline"
          href="/"
        >
          Anasayfaya git
        </Link>
      </section>
    </main>
  );
}
