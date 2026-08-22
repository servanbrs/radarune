"use client";

import { useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Mesaj gönderilemedi.");
        return;
      }

      setSent(true);
      form.reset();
    } catch {
      setError("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-accent">
        <p className="font-semibold">Mesajınız alındı.</p>
        <p className="mt-1 text-sm">Ekibimiz en kısa sürede sizinle iletişime geçecek.</p>
        <button
          className="mt-4 rounded-full border border-accent/30 px-4 py-2 text-sm font-semibold"
          onClick={() => setSent(false)}
          type="button"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form className="mt-7 grid gap-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className="rounded-2xl border border-line bg-background px-4 py-3"
          name="name"
          placeholder="Ad soyad"
          required
        />
        <input
          className="rounded-2xl border border-line bg-background px-4 py-3"
          name="email"
          placeholder="E-posta adresi"
          required
          type="email"
        />
      </div>
      <select
        className="rounded-2xl border border-line bg-background px-4 py-3"
        defaultValue=""
        name="subject"
        required
      >
        <option disabled value="">
          Başvuru türünü seçin
        </option>
        <option value="Teknik destek">Teknik destek</option>
        <option value="Telif bildirimi">Telif bildirimi</option>
        <option value="Dağıtım ve yayın">Dağıtım ve yayın</option>
        <option value="İş ortaklığı">İş ortaklığı</option>
      </select>
      <textarea
        className="min-h-44 rounded-2xl border border-line bg-background px-4 py-3"
        minLength={10}
        name="message"
        placeholder="Nasıl yardımcı olabiliriz?"
        required
      />
      <button
        className="rounded-2xl bg-accent px-5 py-3.5 font-semibold text-accent-foreground disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Gönderiliyor…" : "Başvuruyu gönder →"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
