import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { aiProviderRegistry } from "@/features/intelligence/server/adapters/ai-provider-registry";

export async function POST(request: Request) {
  try {
    const { user } = await authSessionService.getDashboardContext();
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.systemRole)) return NextResponse.json({ error: "Yönetici yetkisi gerekli." }, { status: 403 });
    const body = await request.json() as { title?: string; description?: string; keywords?: string };
    const input = [body.title, body.description, body.keywords].filter(Boolean).join("\n").trim();
    if (!input) return NextResponse.json({ error: "En az bir SEO alanı girin." }, { status: 400 });
    const result = await aiProviderRegistry.get("OPENAI").analyzeText({ text: `SEO yardımcısı olarak bu metinleri 60 karakterlik başlık, 155 karakterlik açıklama ve virgülle ayrılmış anahtar kelimeler halinde iyileştir. Yalnızca {title,description,keywords} JSON döndür.\n${input}` });
    if (result.success) return NextResponse.json({ ...(typeof result.data.structuredResult === "object" && result.data.structuredResult ? result.data.structuredResult : {}), source: "OPENAI" });
    const title = (body.title || "Radarune | Müzik keşfi").slice(0, 60);
    const description = (body.description || "Radarune ile yeni müzikleri keşfedin ve şarkınızı ücretsiz duyurun.").slice(0, 155);
    return NextResponse.json({ title, description, keywords: body.keywords || "müzik, yeni müzik, sanatçı, şarkı keşfet", source: "INTERNAL", note: result.message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "SEO yardımcısı kullanılamadı." }, { status: 500 });
  }
}
