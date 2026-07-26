"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, CircleAlert, ExternalLink } from "lucide-react";
import type { BootstrapStatus, InstallCheck } from "@/features/platform/server/services/install.service";

const steps = [
  { key: "SYSTEM", label: "Sistem kontrolü" },
  { key: "ADMIN", label: "Yönetici hesabı" },
  { key: "WORKSPACE", label: "Çalışma alanı" },
  { key: "SETTINGS", label: "İlk ayarlar" },
] as const;

function CheckRow({ check }: { check: InstallCheck }) {
  const failed = check.status === "FAIL";
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-4">
      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${failed ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"}`}>
        {failed ? <CircleAlert className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
      </span>
      <div>
        <p className="font-semibold">{check.label}</p>
        <p className="mt-1 text-sm text-muted">{check.message}</p>
      </div>
    </div>
  );
}

export function InstallWizard({ status }: { status: BootstrapStatus }) {
  const [currentStep, setCurrentStep] = useState(0);
  const hasBlockingCheck = status.checks.some((check) => check.status === "FAIL");
  const step = steps[currentStep] ?? steps[0];

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground md:px-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Radarune kurulumu</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">İlk kurulumu tamamlayın.</h1>
            <p className="mt-4 max-w-2xl text-muted">Sistem bağlantılarını kontrol edin, ilk yönetici hesabını oluşturun ve çalışma alanınızı başlatın.</p>
          </div>
          <span className="hidden rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted md:inline-flex">Sıfır kurulum</span>
        </header>

        <nav aria-label="Kurulum adımları" className="mb-8 grid gap-2 md:grid-cols-4">
          {steps.map((item, index) => (
            <button
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${index === currentStep ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-accent/40"}`}
              key={item.key}
              onClick={() => setCurrentStep(index)}
              type="button"
            >
              <span className="font-mono text-xs text-muted">0{index + 1}</span>
              <span className="mt-1 block font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <section className="panel p-6 md:p-10">
          {step.key === "SYSTEM" ? (
            <div>
              <p className="text-sm font-semibold text-accent">Adım 1</p>
              <h2 className="mt-2 text-2xl font-semibold">Sistem gereksinimleri</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {status.checks.map((check) => <CheckRow check={check} key={check.key} />)}
              </div>
              {hasBlockingCheck ? <p className="mt-5 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">Kuruluma devam etmeden önce başarısız kontrolleri düzeltin. Migration için Hostinger sunucusunda `npm run prisma:migrate:deploy` çalıştırılmalıdır.</p> : null}
            </div>
          ) : null}

          {step.key === "ADMIN" ? (
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-accent">Adım 2</p>
              <h2 className="mt-2 text-2xl font-semibold">İlk yönetici hesabı</h2>
              <p className="mt-4 leading-7 text-muted">Hesabınızı Better Auth kayıt akışıyla oluşturun. İlk kurulumda public form üzerinden doğrudan SUPER_ADMIN yazmıyoruz; güvenli hesap ve oturum akışı korunuyor.</p>
              <Link className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground" href="/sign-up">Yönetici hesabı oluştur <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          ) : null}

          {step.key === "WORKSPACE" ? (
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-accent">Adım 3</p>
              <h2 className="mt-2 text-2xl font-semibold">Çalışma alanını oluşturun</h2>
              <p className="mt-4 leading-7 text-muted">Organization adı ve slug bilgisi tenant sınırını oluşturur. Label, artist, release, finans ve dağıtım verileri bu çalışma alanına bağlanır.</p>
              <Link className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground" href="/onboarding/organization">Çalışma alanı oluştur <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          ) : null}

          {step.key === "SETTINGS" ? (
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-accent">Adım 4</p>
              <h2 className="mt-2 text-2xl font-semibold">İlk platform ayarları</h2>
              <p className="mt-4 leading-7 text-muted">Çalışma alanı oluşturulduktan sonra provider, storage, e-posta, branding ve güvenlik ayarlarını admin panelinden tamamlayın.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground" href="/admin/settings">Admin ayarlarına git <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
                <Link className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 font-semibold" href="/dashboard">Dashboard&apos;a git <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </div>
          ) : null}

          <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
            <button className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40" disabled={currentStep === 0} onClick={() => setCurrentStep((value) => value - 1)} type="button"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Geri</button>
            <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-40" disabled={currentStep === steps.length - 1 || (currentStep === 0 && hasBlockingCheck)} onClick={() => setCurrentStep((value) => value + 1)} type="button">İleri <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </section>
      </div>
    </main>
  );
}
