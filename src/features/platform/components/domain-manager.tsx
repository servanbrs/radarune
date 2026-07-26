"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customDomainSchema } from "@/features/platform/schemas/platform.schema";
import type { z } from "zod";

type DomainInput = z.infer<typeof customDomainSchema>;
type DomainItem = { id: string; domain: string; status: string; verificationMethod: string; sslStatus: string; verifiedAt: string | null; activatedAt: string | null };

export function DomainManager() {
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<DomainInput>({ resolver: zodResolver(customDomainSchema) });
  const load = async () => { const response = await fetch("/api/admin/domains"); if (!response.ok) throw new Error("Alan adları yüklenemedi."); setDomains(await response.json() as DomainItem[]); };
  useEffect(() => {
    let active = true;
    void fetch("/api/admin/domains").then(async (response) => {
      if (!response.ok) throw new Error("Alan adları yüklenemedi.");
      const items = await response.json() as DomainItem[];
      if (active) setDomains(items);
    }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Alan adları yüklenemedi."); });
    return () => { active = false; };
  }, []);
  const add = async (input: DomainInput) => { const response = await fetch("/api/admin/domains", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); if (!response.ok) throw new Error("Alan adı eklenemedi."); reset(); await load(); setMessage("Alan adı eklendi. DNS TXT kaydı doğrulandıktan sonra aktif edilebilir."); };
  const action = async (id: string, path: string) => { const response = await fetch(`/api/admin/domains/${id}/${path}`, { method: "POST" }); if (!response.ok) throw new Error(path === "verify" ? "DNS doğrulaması başarısız." : "Alan adı aktif edilemedi."); await load(); };
  return <div className="grid gap-5"><form className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-end" onSubmit={handleSubmit(add, () => setMessage("Geçerli bir alan adı girin."))}><label className="grid flex-1 gap-2 text-sm font-medium">Özel alan adı<Input placeholder="music.example.com" {...register("domain")} /></label><Button disabled={isSubmitting} type="submit">Ekle</Button></form><section className="panel overflow-x-auto p-6"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-muted"><th className="p-3">Alan adı</th><th className="p-3">Durum</th><th className="p-3">SSL</th><th className="p-3">İşlem</th></tr></thead><tbody>{domains.map((domain) => <tr className="border-b last:border-0" key={domain.id}><td className="p-3 font-medium">{domain.domain}</td><td className="p-3">{domain.status}</td><td className="p-3">{domain.sslStatus}</td><td className="flex gap-2 p-3"><Button size="sm" type="button" variant="ghost" onClick={() => action(domain.id, "verify").catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Doğrulama başarısız."))}>DNS doğrula</Button>{domain.status === "VERIFIED" ? <Button size="sm" type="button" variant="ghost" onClick={() => action(domain.id, "activate").catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Aktivasyon başarısız."))}>Aktif et</Button> : null}</td></tr>)}</tbody></table>{domains.length === 0 ? <p className="p-4 text-sm text-muted">Henüz özel alan adı eklenmedi.</p> : null}</section>{message ? <p className="rounded-2xl border border-line bg-surface-strong p-3 text-sm">{message}</p> : null}</div>;
}
