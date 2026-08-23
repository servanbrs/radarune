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
import { t } from "@/lib/i18n";

const RESEND_SECONDS = 60;

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function VerifyLoginOtpForm({ locale }: { locale: string }) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(
    t(locale, "verifyLoginDescription"),
  );

  const [remaining, setRemaining] = useState(RESEND_SECONDS);
  const [verified, setVerified] = useState(false);

  const [pending, startTransition] = useTransition();

  async function requestCode() {
    setError(null);
    setMessage(null);

    const result = await authClient.twoFactor.sendOtp();

    if (result.error) {
      setError(
        result.error.message ??
          t(locale, "restartLogin"),
      );
      return false;
    }

    setRemaining(RESEND_SECONDS);
    setMessage(t(locale, "verifyLoginDescription"));

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
        setError(result.error.message ?? t(locale, "verifyLogin"));
        return;
      }

      setVerified(true);
      setMessage(t(locale, "verifyLogin"));

      const next = new URLSearchParams(window.location.search).get("next");
      window.setTimeout(() => {
        router.replace(safeRedirectPath(next));
        router.refresh();
      }, 900);
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
    <div className="auth-otp-shell mx-auto w-full max-w-md">
      <div className={`auth-otp-card rounded-[2rem] border border-line bg-surface p-6 shadow-2xl sm:p-8${pending ? " is-pending" : ""}${verified ? " is-verified" : ""}${error ? " has-error" : ""}`}>
        <div className="auth-otp-icon flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          {verified ? <CheckCircle2 className="size-7" /> : <ShieldCheck className="size-7" />}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {t(locale, "twoFactor")}
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {t(locale, "verifyLoginTitle")}
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted">
          {t(locale, "verifyLoginDescription")}
        </p>

        {pending || verified ? (
          <div
            aria-live="polite"
            className={`auth-otp-verification-stage mt-6${pending ? " is-verifying" : " is-success"}`}
            role="status"
          >
            <div className="auth-otp-verification-orbit" aria-hidden="true">
              <span className="auth-otp-orbit-ring auth-otp-orbit-ring-one" />
              <span className="auth-otp-orbit-ring auth-otp-orbit-ring-two" />
              <span className="auth-otp-orbit-core">
                {verified ? <CheckCircle2 className="size-7" /> : <ShieldCheck className="size-7" />}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {verified ? t(locale, "verifyLoginSuccess") : t(locale, "verifyLoginChecking")}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {verified ? t(locale, "verifyLoginPreparing") : t(locale, "verifyEmailPending")}
              </p>
              <div className="auth-otp-step-track mt-3" aria-hidden="true">
                <span className="is-active" />
                <span className={verified ? "is-active" : ""} />
                <span className={verified ? "is-active" : "is-loading"} />
              </div>
            </div>
          </div>
        ) : null}

        <div aria-hidden="true" className="auth-otp-progress mt-6">
          {Array.from({ length: 6 }, (_, index) => (
            <span className={index < code.length ? "is-filled" : ""} key={index} />
          ))}
        </div>

        <label className="mt-7 grid gap-2 text-sm font-medium">
          {t(locale, "verificationCode")}
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />

            <Input
              autoComplete="one-time-code"
              autoFocus
              className="auth-otp-input h-14 pl-12 text-center text-2xl font-semibold tracking-[0.32em]"
              disabled={pending || verified}
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
            disabled={pending || verified}
            onChange={(event) => setTrustDevice(event.target.checked)}
            type="checkbox"
          />

          <span>
            <span className="block text-sm font-medium">
              {t(locale, "trustDevice")}
            </span>

            <span className="mt-1 block text-xs leading-5 text-muted">
              {t(locale, "trustDeviceDescription")}
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
          disabled={pending || verified || code.length !== 6}
          onClick={verifyCode}
          type="button"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}

          {pending ? t(locale, "verifyEmailPending") : t(locale, "verifyLogin")}
        </Button>

        <Button
          className="mt-3 h-11 w-full"
          disabled={pending || verified || remaining > 0}
          onClick={resendCode}
          type="button"
          variant="secondary"
        >
          <RefreshCw className="size-4" />

          {remaining > 0 ? `${t(locale, "resendCode")} (${remaining})` : t(locale, "sendNewCode")}
        </Button>

        <p className="mt-5 text-center text-xs leading-5 text-muted">
          {t(locale, "codeValidity")}
        </p>

        <Link
          className="mt-5 block text-center text-sm font-medium text-muted hover:text-foreground"
          href="/sign-in"
        >
          {t(locale, "restartLogin")}
        </Link>
      </div>
    </div>
  );
}
