"use client";

import {
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/features/authentication/lib/auth-client";
import { safeRedirectPath } from "@/features/authentication/lib/safe-redirect";

const RESEND_SECONDS = 60;

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function VerifyLoginOtpForm() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(
    "Altı haneli giriş kodu e-posta adresinize gönderildi.",
  );

  const [remaining, setRemaining] = useState(RESEND_SECONDS);

  const [pending, startTransition] = useTransition();

  async function requestCode() {
    setError(null);
    setMessage(null);

    const result = await authClient.twoFactor.sendOtp();

    if (result.error) {
      setError(
        result.error.message ??
          "Giriş kodu gönderilemedi. Giriş işlemini yeniden başlatın.",
      );
      return false;
    }

    setRemaining(RESEND_SECONDS);
    setMessage("Altı haneli giriş kodu e-posta adresinize gönderildi.");

    return true;
  }

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remaining]);

  function verifyCode() {
    if (code.length !== 6 || pending) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await authClient.twoFactor.verifyOtp({
        code,
        trustDevice,
      });

      if (result.error) {
        setError(result.error.message ?? "Güvenlik kodu geçersiz.");
        return;
      }

      setMessage("Giriş doğrulandı. Dashboard açılıyor…");

      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(safeRedirectPath(next));
      router.refresh();
    });
  }

  function resendCode() {
    if (remaining > 0 || pending) {
      return;
    }

    startTransition(async () => {
      await requestCode();
    });
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-[2rem] border border-line bg-surface p-6 shadow-2xl sm:p-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ShieldCheck className="size-7" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          İki adımlı doğrulama
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Girişinizi doğrulayın
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted">
          Şifreniz doğrulandı. Hesabınıza erişmek için e-postanıza gönderilen
          altı haneli güvenlik kodunu girin.
        </p>

        <label className="mt-7 grid gap-2 text-sm font-medium">
          Güvenlik kodu
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />

            <Input
              autoComplete="one-time-code"
              autoFocus
              className="h-14 pl-12 text-center text-2xl font-semibold tracking-[0.32em]"
              inputMode="numeric"
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && code.length === 6) {
                  event.preventDefault();
                  verifyCode();
                }
              }}
              placeholder="000000"
              value={code}
            />
          </div>
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-background/60 px-4 py-3">
          <input
            checked={trustDevice}
            className="mt-1 size-4 accent-current"
            onChange={(event) => setTrustDevice(event.target.checked)}
            type="checkbox"
          />

          <span>
            <span className="block text-sm font-medium">
              Bu cihaza 30 gün güven
            </span>

            <span className="mt-1 block text-xs leading-5 text-muted">
              Bu tarayıcıda 30 gün boyunca tekrar güvenlik kodu istenmez.
            </span>
          </span>
        </label>

        {error ? (
          <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {message}
          </p>
        ) : null}

        <Button
          className="mt-6 h-12 w-full"
          disabled={pending || code.length !== 6}
          onClick={verifyCode}
          type="button"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}

          {pending ? "Doğrulanıyor…" : "Girişi doğrula"}
        </Button>

        <Button
          className="mt-3 h-11 w-full"
          disabled={pending || remaining > 0}
          onClick={resendCode}
          type="button"
          variant="secondary"
        >
          <RefreshCw className="size-4" />

          {remaining > 0 ? `Tekrar gönder (${remaining})` : "Yeni kod gönder"}
        </Button>

        <p className="mt-5 text-center text-xs leading-5 text-muted">
          Kod 10 dakika geçerlidir. Beş başarısız denemeden sonra hesap güvenlik
          amacıyla 15 dakika kilitlenir.
        </p>

        <Link
          className="mt-5 block text-center text-sm font-medium text-muted hover:text-foreground"
          href="/sign-in"
        >
          Giriş işlemini yeniden başlat
        </Link>
      </div>
    </div>
  );
}
