import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Music2,
  ShieldCheck,
} from "lucide-react";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { creatorAccessService } from "@/features/authorization/server/creator-access.service";

export default async function BecomePage() {
  const { user } =
    await authSessionService.getDashboardContext();

  const access = creatorAccessService.getAccess({
    systemRole: user.systemRole,
  });

  if (access.canCreateReleases) {
    return (
      <main className="page-shell">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-line bg-surface p-7 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <CheckCircle2
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Radarune Creator
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Creator erişimin aktif
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Hesabın yayın oluşturma araçlarına erişebiliyor.
            Yeni bir yayın hazırlayabilir ve creator araçlarını
            kullanabilirsin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white"
              href="/releases/new"
            >
              Yeni yayın oluştur
            </Link>

            {access.canManageArtists ? (
              <Link
                className="rounded-full border border-line px-5 py-3 text-sm font-semibold"
                href="/artists"
              >
                Sanatçıları yönet
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Radarune Creator
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Müziğini yayınlamaya başla
        </h1>

        <p className="mt-5 text-base leading-8 text-muted">
          Sanatçı olarak kendi müziğini yayınlayabilir veya
          organizatör olarak birden fazla sanatçının kataloğunu
          yönetebilirsin.
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <article className="rounded-[2rem] border border-line bg-surface p-7 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Music2
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-6 text-2xl font-semibold">
            Sanatçı başvurusu
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted">
            Kendi müziğini yayınlamak, sanatçı profilini
            yönetmek ve Radarune Keşfet alanında dinleyicilere
            ulaşmak için başvur.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-muted">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              Doğrulanmış e-posta hesabı
            </li>

            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              Tamamlanmış kullanıcı profili
            </li>

            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              Müzik veya sosyal medya bağlantısı
            </li>
          </ul>

          <button
            className="mt-8 w-full cursor-not-allowed rounded-full bg-foreground/50 px-5 py-3 text-sm font-semibold text-white"
            disabled
            type="button"
          >
            Başvuru formu yakında açılacak
          </button>
        </article>

        <article className="rounded-[2rem] border border-line bg-surface p-7 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Building2
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-6 text-2xl font-semibold">
            Organizatör başvurusu
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted">
            Menajer, label veya organizatör olarak birden fazla
            sanatçının yayınlarını tek panel üzerinden yönet.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-muted">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              Temsil edilen sanatçı bilgileri
            </li>

            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              Profesyonel veya kurumsal bağlantılar
            </li>

            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              Ayrıntılı admin incelemesi
            </li>
          </ul>

          <button
            className="mt-8 w-full cursor-not-allowed rounded-full border border-line px-5 py-3 text-sm font-semibold text-muted"
            disabled
            type="button"
          >
            Başvuru formu yakında açılacak
          </button>
        </article>
      </section>
    </main>
  );
}
