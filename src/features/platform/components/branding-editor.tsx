"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandingUpdateSchema, type BrandingUpdateInput } from "@/features/platform/schemas/platform.schema";

export function BrandingEditor() {
  const [message, setMessage] = useState<string | null>(null);
  const { register, reset, handleSubmit, formState: { isSubmitting } } = useForm<BrandingUpdateInput>({ resolver: zodResolver(brandingUpdateSchema), defaultValues: { brandName: "", legalName: null, logoUrl: null, faviconUrl: null, supportEmail: null } });
  useEffect(() => { let active = true; void fetch("/api/admin/site-builder/branding").then(async (response) => { if (!response.ok) throw new Error("Marka ayarları yüklenemedi."); const value: unknown = await response.json(); if (active && value) reset(value as BrandingUpdateInput); }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Marka ayarları yüklenemedi."); }); return () => { active = false; }; }, [reset]);
  const save = async (input: BrandingUpdateInput) => { const response = await fetch("/api/admin/site-builder/branding", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); if (!response.ok) throw new Error("Marka ayarları kaydedilemedi."); setMessage("Marka ayarları kaydedildi."); };
  return <form className="panel grid gap-5 p-6" onSubmit={handleSubmit(save, () => setMessage("Marka alanlarını kontrol edin."))}>{message ? <p className="rounded-2xl border border-line bg-surface-strong p-3 text-sm">{message}</p> : null}<div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Marka adı<Input {...register("brandName")} /></label><label className="grid gap-2 text-sm font-medium">Yasal ad<Input {...register("legalName")} /></label><label className="grid gap-2 text-sm font-medium">Logo URL<Input {...register("logoUrl")} /></label><label className="grid gap-2 text-sm font-medium">Favicon URL<Input {...register("faviconUrl")} /></label><label className="grid gap-2 text-sm font-medium">Destek e-postası<Input type="email" {...register("supportEmail")} /></label></div><Button disabled={isSubmitting} type="submit">Kaydet</Button></form>;
}
