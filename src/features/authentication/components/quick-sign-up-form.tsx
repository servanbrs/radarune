"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authClient } from "@/features/authentication/lib/auth-client";

const quickSignUpSchema = z.object({
  name: z.string().trim().min(2, "Adınızı yazın."),
  email: z.string().trim().email("Geçerli bir e-posta yazın."),
  password: z.string().min(6, "Şifreniz en az 6 karakter olmalı."),
  acceptTerms: z.boolean().refine(Boolean, "Kullanım koşullarını kabul etmelisiniz."),
});

type QuickSignUpValues = z.infer<typeof quickSignUpSchema>;

export function QuickSignUpForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<QuickSignUpValues>({ resolver: zodResolver(quickSignUpSchema), defaultValues: { name: "", email: "", password: "", acceptTerms: false } });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await authClient.signUp.email({ name: values.name, email: values.email, password: values.password });
      if (result.error) { setError(result.error.message ?? "Hesap oluşturulamadı."); return; }
      router.replace("/dashboard");
      router.refresh();
    });
  });

  return <form className="grid gap-4" onSubmit={onSubmit}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium text-white/80">Ad soyad<input className="h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none placeholder:text-white/35 focus:border-[#efb848]" placeholder="Adınız Soyadınız" {...form.register("name")} />{form.formState.errors.name ? <span className="text-xs text-[#ff9b9b]">{form.formState.errors.name.message}</span> : null}</label>
      <label className="grid gap-2 text-sm font-medium text-white/80">E-posta<input className="h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none placeholder:text-white/35 focus:border-[#efb848]" placeholder="siz@ornek.com" type="email" {...form.register("email")} />{form.formState.errors.email ? <span className="text-xs text-[#ff9b9b]">{form.formState.errors.email.message}</span> : null}</label>
    </div>
    <label className="grid gap-2 text-sm font-medium text-white/80">Şifre<input className="h-11 rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none placeholder:text-white/35 focus:border-[#efb848]" placeholder="En az 6 karakter" type="password" {...form.register("password")} />{form.formState.errors.password ? <span className="text-xs text-[#ff9b9b]">{form.formState.errors.password.message}</span> : null}</label>
    <label className="flex items-start gap-3 text-xs leading-5 text-white/60"><input className="mt-1 size-4 accent-[#efb848]" type="checkbox" {...form.register("acceptTerms")} /><span><Link className="text-white underline" href="/terms">Kullanım koşullarını</Link> ve <Link className="text-white underline" href="/privacy">gizlilik politikasını</Link> kabul ediyorum.{form.formState.errors.acceptTerms ? <span className="mt-1 block text-[#ff9b9b]">{form.formState.errors.acceptTerms.message}</span> : null}</span></label>
    {error ? <p className="rounded-xl border border-[#ff9b9b]/30 bg-[#ff9b9b]/10 px-3 py-2 text-xs text-[#ffb2b2]">{error}</p> : null}
    <button className="inline-flex h-12 items-center justify-center rounded-xl bg-[#efb848] px-5 font-semibold text-[#090b0f] transition hover:bg-[#ffd46f] disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">{pending ? "Hesap oluşturuluyor…" : "Ücretsiz hesap oluştur"}</button>
  </form>;
}
