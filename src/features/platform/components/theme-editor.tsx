"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { themeUpdateSchema, type ThemeUpdateInput } from "@/features/platform/schemas/platform.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const colorFields = [
  ["primaryColor", "Birincil renk"],
  ["secondaryColor", "İkincil renk"],
  ["accentColor", "Vurgu rengi"],
  ["backgroundColor", "Arka plan"],
  ["cardColor", "Kart"],
  ["textColor", "Metin"],
  ["mutedTextColor", "Soluk metin"],
  ["borderColor", "Çerçeve"],
  ["successColor", "Başarı"],
  ["warningColor", "Uyarı"],
  ["errorColor", "Hata"],
  ["buttonBackground", "Buton arka planı"],
  ["buttonText", "Buton metni"],
  ["linkColor", "Bağlantı"],
  ["sidebarColor", "Sidebar"],
  ["headerColor", "Header"],
  ["playerColor", "Player"],
  ["discoverColor", "Discover"],
  ["rankingColor", "Sıralama"],
  ["popupColor", "Popup"],
] as const;

export function ThemeEditor() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<ThemeUpdateInput>({ resolver: zodResolver(themeUpdateSchema) });

  useEffect(() => {
    fetch("/api/admin/site-builder/theme").then(async (response) => {
      if (!response.ok) throw new Error("Tema yüklenemedi.");
      reset(await response.json() as ThemeUpdateInput);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Tema yüklenemedi.")).finally(() => setLoading(false));
  }, [reset]);

  const save = async (input: ThemeUpdateInput) => {
    setMessage(null);
    const response = await fetch("/api/admin/site-builder/theme", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Tema kaydedilemedi.");
    setMessage("Tema taslak olarak kaydedildi.");
  };

  const publish = async () => {
    const response = await fetch("/api/admin/site-builder/theme", { method: "POST" });
    if (!response.ok) throw new Error("Tema yayınlanamadı.");
    setMessage("Tema yayınlandı.");
  };

  if (loading) return <div className="panel p-6 text-sm text-muted">Tema yükleniyor...</div>;
  return (
    <form className="panel grid gap-6 p-6" onSubmit={handleSubmit(save, (formErrors) => setMessage(String(Object.values(formErrors)[0]?.message ?? "Form alanlarını kontrol edin.")))}>
      {message ? <p className="rounded-2xl border border-line bg-surface-strong p-3 text-sm">{message}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colorFields.map(([name, label]) => (
          <label className="grid gap-2 text-sm font-medium" key={name}>{label}<Input {...register(name)} placeholder="#112233" />{errors[name]?.message ? <span className="text-xs text-danger">{errors[name].message}</span> : null}</label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium">Köşe yarıçapı<Input type="number" {...register("borderRadius", { valueAsNumber: true })} /></label>
        <label className="grid gap-2 text-sm font-medium">Gölge yoğunluğu<Input type="number" {...register("shadowIntensity", { valueAsNumber: true })} /></label>
        <label className="grid gap-2 text-sm font-medium">Font ailesi<Input {...register("fontFamily")} /></label>
        <label className="grid gap-2 text-sm font-medium">Konteyner genişliği<Input {...register("containerWidth")} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">Yoğunluk<select className="h-11 rounded-xl border bg-background px-3" {...register("density")}><option value="COMPACT">Sıkı</option><option value="COMFORTABLE">Rahat</option><option value="SPACIOUS">Geniş</option></select></label>
        <label className="grid gap-2 text-sm font-medium">Renk modu<select className="h-11 rounded-xl border bg-background px-3" {...register("colorScheme")}><option value="SYSTEM">Sistem</option><option value="LIGHT">Açık</option><option value="DARK">Koyu</option></select></label>
        <label className="flex items-center gap-3 pt-7 text-sm font-medium"><input type="checkbox" {...register("gradientsEnabled")} /> Gradient kullan</label>
      </div>
      <div className="flex flex-wrap gap-3"><Button disabled={isSubmitting} type="submit">Taslağı kaydet</Button><Button type="button" variant="secondary" onClick={() => publish().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Tema yayınlanamadı."))}>Yayınla</Button></div>
    </form>
  );
}
