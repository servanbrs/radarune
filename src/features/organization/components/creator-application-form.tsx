"use client";

import { useState } from "react";

type ApplicationKind = "ORGANIZATION" | "LABEL";

export function CreatorApplicationForm({ kind }: { kind: ApplicationKind }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    const name = String(formData.get("name") ?? "").trim();
    const legalName = String(formData.get("legalName") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();
    const representedArtists = String(formData.get("representedArtists") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim();

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: `${kind === "LABEL" ? "Label" : "Organizasyon"} başvurusu · ${name}`,
          priority: "NORMAL",
          message: [
            `Başvuru türü: ${kind === "LABEL" ? "Label" : "Organizasyon"}`,
            `Marka / organizasyon adı: ${name}`,
            `Yasal ad: ${legalName || "Belirtilmedi"}`,
            `Web sitesi: ${website || "Belirtilmedi"}`,
            `Temsil edilen sanatçı sayısı: ${representedArtists || "Belirtilmedi"}`,
            "",
            details,
          ].join("\n"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Başvuru gönderilemedi.");
      setMessage("Başvurunuz alındı. İnceleme sonucu e-posta ve dashboard bildirimiyle iletilecek.");
      (document.querySelector("form[data-creator-application]") as HTMLFormElement | null)?.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Başvuru gönderilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} data-creator-application className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm font-medium">Marka / organizasyon adı<input className="rounded-xl border border-line bg-white px-4 py-3" name="name" required /></label>
      <label className="grid gap-2 text-sm font-medium">Yasal ad<input className="rounded-xl border border-line bg-white px-4 py-3" name="legalName" /></label>
      <label className="grid gap-2 text-sm font-medium">Web sitesi veya sosyal medya<input className="rounded-xl border border-line bg-white px-4 py-3" name="website" type="url" /></label>
      <label className="grid gap-2 text-sm font-medium">Temsil edilen sanatçı sayısı<input className="rounded-xl border border-line bg-white px-4 py-3" name="representedArtists" inputMode="numeric" /></label>
      <label className="grid gap-2 text-sm font-medium">Başvuru detayları<textarea className="min-h-32 rounded-xl border border-line bg-white px-4 py-3" name="details" minLength={10} required placeholder="Kataloğunuzu, ekibinizi ve Radarune'den beklentinizi anlatın." /></label>
      <button className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Gönderiliyor…" : "Başvuruyu gönder"}</button>
      {message ? <p className="rounded-xl border border-line bg-surface p-3 text-sm">{message}</p> : null}
    </form>
  );
}
