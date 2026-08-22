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
import { t } from "@/lib/i18n";

type VerifyEmailOtpFormProps = {
  initialEmail: string;
  locale: string;
};

const RESEND_SECONDS = 60;

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function VerifyEmailOtpForm({ initialEmail, locale }: VerifyEmailOtpFormProps) {
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
        setError(result.error.message ?? t(locale, "sendNewCode"));
        return;
      }

      setRemaining(RESEND_SECONDS);

      setMessage(t(locale, "sendNewCode"));
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
        setError(result.error.message ?? t(locale, "verifyEmail"));
        return;
      }

      setMessage(t(locale, "verifyEmail"));

      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 700);
    });
  }

  return (
    <div className="auth-otp-shell mx-auto w-full max-w-md">
      <div className={`auth-otp-card rounded-[2rem] border border-line bg-surface p-6 shadow-2xl sm:p-8${pending ? " is-pending" : ""}${error ? " has-error" : ""}`}>
        <div className="auth-otp-icon flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <MailCheck className="size-7" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {t(locale, "accountSecurity")}
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {t(locale, "verifyEmailTitle")}
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted">
          {t(locale, "verifyEmailDescription")}
        </p>

        <div aria-hidden="true" className="auth-otp-progress mt-6">
          {Array.from({ length: 6 }, (_, index) => (
            <span className={index < code.length ? "is-filled" : ""} key={index} />
          ))}
        </div>

        <label className="mt-7 grid gap-2 text-sm font-medium">
          {t(locale, "email")}
          <Input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>

        <label className="mt-4 grid gap-2 text-sm font-medium">
          {t(locale, "verificationCode")}
          <Input
            autoComplete="one-time-code"
            className="auth-otp-input h-14 text-center text-2xl font-semibold tracking-[0.35em]"
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

          {pending ? t(locale, "verifyEmailPending") : t(locale, "verifyEmail")}
        </Button>

        <Button
          className="mt-3 h-11 w-full"
          disabled={pending || !validEmail || remaining > 0}
          onClick={sendCode}
          type="button"
          variant="secondary"
        >
          <RefreshCw className="size-4" />

          {remaining > 0 ? `${t(locale, "resendCode")} (${remaining})` : t(locale, "sendNewCode")}
        </Button>

        <p className="mt-5 text-center text-xs leading-5 text-muted">
          {t(locale, "codeValidity")}
        </p>
      </div>
    </div>
  );
}
