import { NextResponse } from "next/server";
import { z } from "zod";

import { aiProviderService } from "@/features/ai-provider/server/services/ai-provider.service";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, "Mesaj en az 2 karakter olmalıdır.")
    .max(10000, "Mesaj en fazla 10.000 karakter olabilir."),
  systemPrompt: z.string().trim().max(10000).optional(),
  temperature: z.number().min(0).max(2).default(0.4),
  maxOutputTokens: z.number().int().min(16).max(4000).default(1200),
});

export async function POST(request: Request) {
  try {
    const actor = await getAdminIntelligenceActor();
    const input = requestSchema.parse(await request.json());

    const result = await aiProviderService.generateText({
      organizationId: actor.organizationId,
      userPrompt: input.prompt,
      systemPrompt:
        input.systemPrompt ||
        [
          "Sen Radarune müzik dağıtım platformunun profesyonel yapay zekâ asistanısın.",
          "Türkçe, net, doğru ve uygulanabilir cevaplar ver.",
          "Müzik dağıtımı, sanatçı yönetimi, metadata, pazarlama ve yayın kontrollerinde yardımcı ol.",
        ].join(" "),
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
    });

    if (!result.success) {
      const configurationRequired =
        "status" in result && result.status === "CONFIGURATION_REQUIRED";

      return NextResponse.json(
        {
          success: false,
          status: "status" in result ? result.status : "FAILED",
          message: result.message,
        },
        {
          status: configurationRequired ? 422 : 400,
        },
      );
    }

    return NextResponse.json({
      success: true,
      text: result.text,
      configuration: result.configuration,
      usage: null,
    });
  } catch (error) {
    console.error("Admin AI chat error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          status: "VALIDATION_ERROR",
          message: error.issues[0]?.message ?? "Gönderilen bilgiler geçersiz.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        status: "SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "AI isteği tamamlanamadı.",
      },
      { status: 500 },
    );
  }
}
