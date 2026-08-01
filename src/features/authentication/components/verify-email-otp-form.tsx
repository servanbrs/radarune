"use client";

import {
  CheckCircle2,
  Loader2,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/features/authentication/lib/auth-client";

type VerifyEmailOtpFormProps = {
  initialEmail: string;
};

const RESEND_SECONDS = 60;

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function VerifyEmailOtpForm({ initialEmail }: VerifyEmailOtpFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail);

  const [code, setCode] = useState("");

  const [message, setMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [remaining, setRemaining] = useState(RESEND_SECONDS);

  const [pending, startTransition] = useTransition();

  const validEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remaining]);

  function sendCode() {
    if (!validEmail || pending) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "email-verification",
      });

      if (result.error) {
        setError(result.error.message ?? "Doğrulama kodu gönderilemedi.");
        return;
      }

      setRemaining(RESEND_SECONDS);

      setMessage("Yeni doğrulama kodu e-posta adresinize gönderildi.");
    });
  }

  function verifyCode() {
    if (!validEmail || code.length !== 6 || pending) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await authClient.emailOtp.verifyEmail({
        email: email.trim(),
        otp: code,
      });

      if (result.error) {
        setError(result.error.message ?? "Kod doğrulanamadı.");
        return;
      }

      setMessage("E-posta adresiniz doğrulandı. Yönlendiriliyorsunuz…");

      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 700);
    });
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-[2rem] border border-line bg-surface p-6 shadow-2xl sm:p-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <MailCheck className="size-7" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Hesap güvenliği
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          E-posta adresinizi doğrulayın
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted">
          E-posta adresinize gönderilen altı haneli doğrulama kodunu girin.
        </p>

        <label className="mt-7 grid gap-2 text-sm font-medium">
          E-posta
          <Input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>

        <label className="mt-4 grid gap-2 text-sm font-medium">
          Doğrulama kodu
          <Input
            autoComplete="one-time-code"
            className="h-14 text-center text-2xl font-semibold tracking-[0.35em]"
            inputMode="numeric"
            onChange={(event) => setCode(normalizeCode(event.target.value))}
            placeholder="000000"
            value={code}
          />
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
          disabled={pending || !validEmail || code.length !== 6}
          onClick={verifyCode}
          type="button"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}

          {pending ? "Doğrulanıyor…" : "E-postayı doğrula"}
        </Button>

        <Button
          className="mt-3 h-11 w-full"
          disabled={pending || !validEmail || remaining > 0}
          onClick={sendCode}
          type="button"
          variant="secondary"
        >
          <RefreshCw className="size-4" />

          {remaining > 0 ? `Tekrar gönder (${remaining})` : "Yeni kod gönder"}
        </Button>

        <p className="mt-5 text-center text-xs leading-5 text-muted">
          Kod 10 dakika geçerlidir. Beş yanlış denemeden sonra yeni kod
          istemeniz gerekir.
        </p>
      </div>
    </div>
  );
}
