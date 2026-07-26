"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sitePageUpdateSchema, type SitePageUpdateInput } from "@/features/platform/schemas/platform.schema";

const dataSources = ["MANUAL", "LATEST_RELEASES", "TRENDING_RELEASES", "GLOBAL_CHART", "TURKEY_CHART", "FEATURED_ARTISTS", "FEATURED_PLAYLISTS", "ACTIVE_CAMPAIGN", "ACTIVE_REWARD_VOTE"] as const;

export function HomepageEditor() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const { control, register, reset, handleSubmit, formState: { isSubmitting } } = useForm<SitePageUpdateInput>({ resolver: zodResolver(sitePageUpdateSchema), defaultValues: { title: "Ana Sayfa", sections: [] } });
  const { fields, append, remove, move } = useFieldArray({ control, name: "sections" });

  useEffect(() => {
    fetch("/api/admin/site-builder/homepage").then(async (response) => {
      if (!response.ok) throw new Error("Ana sayfa yüklenemedi.");
      const value: unknown = await response.json();
      if (value && typeof value === "object" && "title" in value && "sections" in value && Array.isArray(value.sections)) {
        reset(value as SitePageUpdateInput);
      }
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Ana sayfa yüklenemedi.")).finally(() => setLoading(false));
  }, [reset]);

  const save = async (input: SitePageUpdateInput) => {
    const response = await fetch("/api/admin/site-builder/homepage", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
    if (!response.ok) throw new Error("Ana sayfa taslağı kaydedilemedi.");
    setMessage("Ana sayfa taslağı kaydedildi.");
  };

  const publish = async () => {
    const response = await fetch("/api/admin/site-builder/homepage", { method: "POST" });
    if (!response.ok) throw new Error("Ana sayfa yayınlanamadı.");
    setMessage("Ana sayfa yayınlandı.");
  };

  if (loading) return <div className="panel p-6 text-sm text-muted">Ana sayfa yükleniyor...</div>;
  return <form className="grid gap-5" onSubmit={handleSubmit(save, () => setMessage("Ana sayfa alanlarını kontrol edin."))}>
    <section className="panel grid gap-4 p-6"><label className="grid gap-2 text-sm font-medium">Sayfa başlığı<Input {...register("title")} /></label></section>
    {fields.map((field, index) => <section className="panel grid gap-4 p-6" key={field.id}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Bölüm {index + 1}</h2><div className="flex gap-2"><Button size="sm" type="button" variant="ghost" disabled={index === 0} onClick={() => move(index, index - 1)}>Yukarı</Button><Button size="sm" type="button" variant="ghost" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>Aşağı</Button><Button size="sm" type="button" variant="ghost" onClick={() => remove(index)}>Kaldır</Button></div></div>
      <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Bölüm tipi<Input {...register(`sections.${index}.sectionType`)} /></label><label className="grid gap-2 text-sm font-medium">Veri kaynağı<select className="h-12 rounded-2xl border bg-white px-4 text-sm" {...register(`sections.${index}.dataSource`)}>{dataSources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label></div>
      <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Başlık<Input {...register(`sections.${index}.title`)} /></label><label className="grid gap-2 text-sm font-medium">Alt başlık<Input {...register(`sections.${index}.subtitle`)} /></label></div>
      <label className="grid gap-2 text-sm font-medium">Açıklama<Textarea {...register(`sections.${index}.description`)} /></label>
      <div className="grid gap-4 md:grid-cols-3"><label className="grid gap-2 text-sm font-medium">Görsel URL<Input {...register(`sections.${index}.imageUrl`)} /></label><label className="grid gap-2 text-sm font-medium">CTA metni<Input {...register(`sections.${index}.ctaLabel`)} /></label><label className="grid gap-2 text-sm font-medium">CTA URL<Input {...register(`sections.${index}.ctaUrl`)} /></label></div>
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" {...register(`sections.${index}.active`)} /> Public sayfada aktif</label>
    </section>)}
    {message ? <p className="rounded-2xl border border-line bg-surface-strong p-3 text-sm">{message}</p> : null}
    <div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={() => append({ sectionType: "MANUAL", sortOrder: fields.length, active: true, title: "", subtitle: "", description: "", imageUrl: null, background: null, textAlign: "left", maxItems: null, dataSource: "MANUAL", ctaLabel: "", ctaUrl: null })}>Bölüm ekle</Button><Button disabled={isSubmitting} type="submit">Taslağı kaydet</Button><Button type="button" variant="secondary" onClick={() => publish().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Ana sayfa yayınlanamadı."))}>Yayınla</Button></div>
  </form>;
}
