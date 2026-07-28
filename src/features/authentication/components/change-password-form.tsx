"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/features/authentication/lib/auth-client";

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-4 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const currentPassword = String(form.get("currentPassword") ?? "");
        const newPassword = String(form.get("newPassword") ?? "");
        const confirmPassword = String(form.get("confirmPassword") ?? "");
        setError(null);
        setMessage(null);
        if (newPassword.length < 6 || newPassword !== confirmPassword) {
          setError("Yeni şifre en az 6 karakter olmalı ve tekrarıyla eşleşmeli.");
          return;
        }
        startTransition(async () => {
          const result = await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
          });
          if (result.error) setError(result.error.message ?? "Şifre değiştirilemedi.");
          else {
            setMessage("Şifreniz güncellendi. Diğer oturumlar kapatıldı.");
            event.currentTarget.reset();
          }
        });
      }}
    >
      <input className="rounded-xl border border-line bg-background px-4 py-3" name="currentPassword" placeholder="Mevcut şifre" required type="password" />
      <input className="rounded-xl border border-line bg-background px-4 py-3" name="newPassword" placeholder="Yeni şifre" required type="password" />
      <input className="rounded-xl border border-line bg-background px-4 py-3" name="confirmPassword" placeholder="Yeni şifre tekrar" required type="password" />
      <button className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground disabled:opacity-50" disabled={pending} type="submit">
        {pending ? "Güncelleniyor…" : "Şifreyi güncelle"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </form>
  );
}
