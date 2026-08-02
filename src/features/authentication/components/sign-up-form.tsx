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
import {
  type SignUpFormValues,
  signUpFormSchema,
} from "@/features/authentication/schemas/auth-form.schema";

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setRootError(null);

    startTransition(async () => {
      const result = await authClient.signUp.email({
        email: values.email,
        name: values.name,
        password: values.password,
      });

      if (result.error) {
        setRootError(result.error.message ?? "Hesap oluşturulamadı.");
        return;
      }

      const otpResult = await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "email-verification",
      });

      if (otpResult.error) {
        setRootError(
          otpResult.error.message ??
            "Hesap oluşturuldu ancak doğrulama kodu gönderilemedi.",
        );
        return;
      }

      router.replace(`/verify-email?email=${encodeURIComponent(values.email)}`);
      router.refresh();
    });
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field
        error={form.formState.errors.name?.message}
        htmlFor="sign-up-name"
        label="Ad soyad"
      >
        <Input
          autoComplete="name"
          id="sign-up-name"
          placeholder="Aylin Yilmaz"
          {...form.register("name")}
        />
      </Field>

      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          className="mt-1 size-4 accent-accent"
          type="checkbox"
          {...form.register("acceptTerms")}
        />
        <span>
          <Link className="font-medium text-foreground underline" href="/terms">
            Kullanım koşullarını
          </Link>{" "}
          ve{" "}
          <Link
            className="font-medium text-foreground underline"
            href="/privacy"
          >
            gizlilik politikasını
          </Link>{" "}
          kabul ediyorum.
          {form.formState.errors.acceptTerms?.message ? (
            <span className="mt-1 block text-xs text-danger">
              {form.formState.errors.acceptTerms.message}
            </span>
          ) : null}
        </span>
      </label>

      <Field
        error={form.formState.errors.email?.message}
        htmlFor="sign-up-email"
        label="E-posta"
      >
        <Input
          autoComplete="email"
          id="sign-up-email"
          placeholder="catalog@label.com"
          {...form.register("email")}
        />
      </Field>

      <Field
        error={form.formState.errors.password?.message}
        hint="En az 6 karakter kullanın."
        htmlFor="sign-up-password"
        label="Şifre"
      >
        <Input
          autoComplete="new-password"
          id="sign-up-password"
          placeholder="Güçlü bir şifre oluşturun"
          type="password"
          {...form.register("password")}
        />
      </Field>

      <Field
        error={form.formState.errors.confirmPassword?.message}
        htmlFor="sign-up-confirm-password"
        label="Şifre tekrarı"
      >
        <Input
          autoComplete="new-password"
          id="sign-up-confirm-password"
          placeholder="Şifrenizi tekrar girin"
          type="password"
          {...form.register("confirmPassword")}
        />
      </Field>

      {rootError ? (
        <p className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
          {rootError}
        </p>
      ) : null}

      <Button className="mt-2 w-full" disabled={isPending} type="submit">
        {isPending ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
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
          Google ile kayıt ol
        </Button>
      ) : null}

      <Link
        className="text-sm font-medium text-muted hover:text-foreground"
        href="/sign-in"
      >
        Zaten hesabınız var mı? Giriş yapın.
      </Link>
    </form>
  );
}
