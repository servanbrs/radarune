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
  type SignInFormValues,
  signInFormSchema,
} from "@/features/authentication/schemas/auth-form.schema";

export function SignInForm() {
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
      const result = await authClient.signIn.email(values);

      if (result.error) {
        setRootError(result.error.message ?? "Giriş yapılamadı.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field
        error={form.formState.errors.email?.message}
        htmlFor="sign-in-email"
        label="E-posta"
      >
        <Input
          autoComplete="email"
          id="sign-in-email"
          placeholder="ops@label.com"
          {...form.register("email")}
        />
      </Field>

      <Field
        error={form.formState.errors.password?.message}
        htmlFor="sign-in-password"
        label="Şifre"
      >
        <Input
          autoComplete="current-password"
          id="sign-in-password"
          placeholder="Şifrenizi girin"
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
        {isPending ? "Giriş yapılıyor..." : "Giriş yap"}
      </Button>

      <Link className="text-sm font-medium text-muted hover:text-foreground" href="/sign-up">
        Hesabınız yok mu? Kayıt olun.
      </Link>
    </form>
  );
}
