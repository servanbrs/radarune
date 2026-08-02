import { NextResponse } from "next/server";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { aiProviderService } from "@/features/ai-provider/server/services/ai-provider.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const body = await request.json() as { title?: string; description?: string; artist?: string; platforms?: string };
    const prompt = `Bir müzik sanatçısının Smart Link sayfası için Türkçe SEO metni oluştur. Yalnızca geçerli JSON döndür: {"title":"en fazla 60 karakter","description":"en fazla 160 karakter"}. Sanatçı: ${body.artist ?? ""}. Başlık: ${body.title ?? ""}. Açıklama: ${body.description ?? ""}. Platformlar: ${body.platforms ?? ""}.`;
    const result = await aiProviderService.generateText({ organizationId: actor.organizationId, userPrompt: prompt, systemPrompt: "Yalnızca JSON döndür; markdown kullanma.", temperature: 0.4, maxOutputTokens: 300 });
    if (!result.success) return NextResponse.json({ title: body.title?.slice(0, 60) ?? "", description: body.description?.slice(0, 160) ?? "", source: "INTERNAL", note: result.message });
    const text = result.text.trim().replace(/^```json\s*|\s*```$/g, "");
    const parsed = JSON.parse(text) as { title?: string; description?: string };
    return NextResponse.json({ title: parsed.title?.slice(0, 60) ?? "", description: parsed.description?.slice(0, 160) ?? "", source: result.configuration.provider });
  } catch (error) {
    return growthJsonError(error);
  }
}
