"use client";
/* eslint-disable @next/next/no-img-element -- Branding assets are runtime-uploaded URLs. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandingUpdateSchema, type BrandingUpdateInput } from "@/features/platform/schemas/platform.schema";

type BrandingFormInput = z.input<typeof brandingUpdateSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function portableAssetUrl(url: string | null | undefined) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/media/")) return `${parsed.pathname}${parsed.search}`;
  } catch {
    // Relative URLs are already portable.
  }
  return url;
}

function applyFavicon(url: string | null | undefined) {
  if (!url || typeof document === "undefined") return;
  const portableUrl = portableAssetUrl(url) ?? url;
  const iconUrl = `${portableUrl}${portableUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
  const links = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
    link.href = iconUrl;
    return;
  }
  links.forEach((link) => { link.href = iconUrl; });
}

export function BrandingEditor() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { control, register, reset, setValue, handleSubmit, formState: { isSubmitting, errors } } = useForm<BrandingFormInput, unknown, BrandingUpdateInput>({ resolver: zodResolver(brandingUpdateSchema), defaultValues: { brandName: "", legalName: null, logoUrl: null, faviconUrl: null, supportEmail: null } });
  const logoUrl = useWatch({ control, name: "logoUrl" });
  const faviconUrl = useWatch({ control, name: "faviconUrl" });
  useEffect(() => { let active = true; void fetch("/api/admin/site-builder/branding").then(async (response) => { if (!response.ok) throw new Error("Marka ayarları yüklenemedi."); const value: unknown = await response.json(); if (active && value && typeof value === "object") { const branding = value as Partial<BrandingUpdateInput>; reset({ brandName: branding.brandName?.trim() || "Radarune", legalName: branding.legalName ?? null, logoUrl: branding.logoUrl ?? null, faviconUrl: branding.faviconUrl ?? null, supportEmail: branding.supportEmail ?? null, ...(isRecord(branding.socialLinks) ? { socialLinks: branding.socialLinks } : {}), ...(isRecord(branding.seoDefaults) ? { seoDefaults: branding.seoDefaults } : {}) }); applyFavicon(branding.faviconUrl); } }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Marka ayarları yüklenemedi."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [reset]);
  const save = async (input: BrandingUpdateInput) => { const response = await fetch("/api/admin/site-builder/branding", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); const result: unknown = await response.json().catch(() => null); if (!response.ok) { const error = result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : "Marka ayarları kaydedilemedi."; throw new Error(error); } applyFavicon(input.faviconUrl); setMessage("Marka ayarları kaydedildi. Site simgesi güncelleniyor…"); router.refresh(); setTimeout(() => window.location.reload(), 250); };
  const fieldError = (field: keyof BrandingUpdateInput) => { const error = errors[field]; return typeof error?.message === "string" ? <span className="text-xs font-normal text-red-600">{error.message}</span> : null; };
  async function uploadMedia(file: File, kind: "LOGO" | "FAVICON") { const form = new FormData(); form.set("file", file); form.set("kind", kind); const response = await fetch("/api/admin/site-builder/branding/media", { method: "POST", body: form }); const result: unknown = await response.json(); if (!response.ok || typeof result !== "object" || result === null || !("url" in result) || typeof result.url !== "string") throw new Error(typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "Dosya yüklenemedi."); setValue(kind === "LOGO" ? "logoUrl" : "faviconUrl", result.url, { shouldDirty: true, shouldValidate: true }); setMessage(`${kind === "LOGO" ? "Logo" : "Favicon"} yüklendi. Kaydet düğmesine basarak etkinleştirin.`); }
  return <form className="panel grid gap-5 p-6" onSubmit={handleSubmit(save, () => setMessage("Lütfen kırmızı görünen alanları düzeltin."))}>
    {message ? <p className="rounded-2xl border border-line bg-surface-strong p-3 text-sm">{message}</p> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">Marka adı<Input {...register("brandName")} />{fieldError("brandName")}</label>
      <label className="grid gap-2 text-sm font-medium">Yasal ad<Input {...register("legalName")} />{fieldError("legalName")}</label>
      <section className="grid gap-3 rounded-2xl border border-line bg-surface-strong p-4" aria-labelledby="logo-heading">
        <div><h2 id="logo-heading" className="font-semibold">Site logosu</h2><p className="text-xs text-muted">Sitede ve sosyal paylaşım önizlemelerinde kullanılır.</p></div>
        <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-line bg-surface p-3">
          {logoUrl ? <img src={portableAssetUrl(logoUrl)} alt="Site logosu önizlemesi" className="max-h-16 max-w-full object-contain" /> : <span className="text-xs text-muted">Henüz logo yüklenmedi</span>}
        </div>
        <input className="h-11 rounded-xl border border-line bg-transparent px-3 py-2 text-sm font-normal" accept="image/jpeg,image/png,image/webp" type="file" aria-label="Site logosu dosyası" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file, "LOGO").catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Logo yüklenemedi.")); }} />
        <input type="hidden" {...register("logoUrl")} />
        <span className="text-xs font-normal text-muted">İdeal ölçü: 512x512 piksel. Şeffaf PNG önerilir; en az 256x256 olmalıdır.</span>{fieldError("logoUrl")}
      </section>
      <section className="grid gap-3 rounded-2xl border border-line bg-surface-strong p-4" aria-labelledby="favicon-heading">
        <div><h2 id="favicon-heading" className="font-semibold">Favicon / site simgesi</h2><p className="text-xs text-muted">Tarayıcı sekmesi ve Google arama sonuçları için sabit site simgesidir.</p></div>
        <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-line bg-surface p-3">
          {faviconUrl ? <img src={portableAssetUrl(faviconUrl)} alt="Favicon önizlemesi" className="size-12 rounded-xl object-contain" /> : <span className="text-xs text-muted">Henüz favicon yüklenmedi</span>}
        </div>
        <input className="h-11 rounded-xl border border-line bg-transparent px-3 py-2 text-sm font-normal" accept="image/png,image/x-icon" type="file" aria-label="Favicon dosyası" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file, "FAVICON").catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Favicon yüklenemedi.")); }} />
        <input type="hidden" {...register("faviconUrl")} />
        <span className="text-xs font-normal text-muted">İdeal ölçü: 32x32 veya 48x48 piksel. PNG/ICO; 32–512 piksel aralığı.</span>{fieldError("faviconUrl")}
      </section>
      <label className="grid gap-2 text-sm font-medium">Destek e-postası<Input type="email" {...register("supportEmail")} />{fieldError("supportEmail")}</label>
    </div>
    <Button disabled={loading || isSubmitting} type="submit">{loading ? "Ayarlar yükleniyor…" : isSubmitting ? "Kaydediliyor…" : "Kaydet"}</Button>
  </form>;
}
