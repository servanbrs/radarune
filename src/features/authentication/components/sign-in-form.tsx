"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/features/authentication/lib/auth-client";
import { t } from "@/lib/i18n";
import {
  type SignInFormValues,
  signInFormSchema,
} from "@/features/authentication/schemas/auth-form.schema";

export function SignInForm({
  facebookEnabled,
  googleEnabled,
  nextPath,
  locale,
}: {
  facebookEnabled: boolean;
  googleEnabled: boolean;
  nextPath: string;
  locale: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setRootError(null);

    startTransition(async () => {
      const result = await authClient.signIn.email({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        rememberMe: true,
      });

      if (result.error) {
        setRootError(result.error.message ?? t(locale, "emailOrPasswordInvalid"));
        return;
      }

      const data = result.data;

      if (
        data &&
        "twoFactorRedirect" in data &&
        data.twoFactorRedirect === true
      ) {
        /*
         * OTP, doğrulama ekranına geçmeden önce gönderilir.
         * Böylece Better Auth 2FA çerezinin ilk yönlendirmede
         * henüz hazır olmaması kaynaklı çift giriş sorunu önlenir.
         */
        const otpResult = await authClient.twoFactor.sendOtp();

        if (otpResult.error) {
          setRootError(
            otpResult.error.message ??
              t(locale, "restartLogin"),
          );
          return;
        }

        const verifyUrl = new URL("/verify-login", window.location.origin);
        verifyUrl.searchParams.set("sent", "1");
        verifyUrl.searchParams.set("next", nextPath);
        window.location.replace(verifyUrl.toString());
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  });

  return (
    <form className="auth-form flex flex-col gap-4" onSubmit={onSubmit}>
      <Field
        error={form.formState.errors.email?.message}
        htmlFor="sign-in-email"
        label={t(locale, "email")}
      >
        <Input
          autoComplete="email"
          id="sign-in-email"
          placeholder="siz@ornek.com"
          type="email"
          {...form.register("email")}
        />
      </Field>

      <Field
        error={form.formState.errors.password?.message}
        htmlFor="sign-in-password"
        label={t(locale, "password")}
      >
        <Input
          autoComplete="current-password"
          id="sign-in-password"
          placeholder={t(locale, "passwordPlaceholder")}
          type="password"
          {...form.register("password")}
        />
      </Field>

      {rootError ? (
        <p className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
          {rootError}
        </p>
      ) : null}

      <Button className="mt-2 w-full" disabled={isPending} type="submit">
        {isPending ? t(locale, "signInPending") : t(locale, "login")}
      </Button>

      {googleEnabled ? (
        <Button
          className="w-full"
          onClick={() =>
            void authClient.signIn.social({
              provider: "google",
              callbackURL: "/dashboard",
            })
          }
          type="button"
          variant="secondary"
        >
          {t(locale, "googleContinue")}
        </Button>
      ) : null}

      {facebookEnabled ? (
        <Button className="w-full" onClick={() => void authClient.signIn.social({ provider: "facebook", callbackURL: nextPath })} type="button" variant="secondary">
          {t(locale, "facebookContinue")}
        </Button>
      ) : null}

      <Link
        className="text-sm font-medium text-muted hover:text-foreground"
        href="/sign-up"
      >
        {t(locale, "accountMissing")}
      </Link>
    </form>
  );
}
