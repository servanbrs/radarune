import { NextResponse } from "next/server";
import { financeActorService } from "@/features/finance/server/services/finance-actor.service";
import { serializeForJson } from "@/features/finance/server/lib/serializers";

type IntelligenceRouteActor = NonNullable<Awaited<ReturnType<typeof financeActorService.getOptionalRouteActor>>>;

export async function withIntelligenceActor(handler: (actor: IntelligenceRouteActor) => Promise<Response>) {
  const actor = await financeActorService.getOptionalRouteActor();

  if (!actor) {
    return NextResponse.json(
      {
        success: false,
        message: "Oturum bulunamadı.",
      },
      { status: 401 },
    );
  }

  try {
    return await handler(actor);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intelligence işlemi başarısız oldu.";
    const status = message.includes("yetkiniz")
      ? 403
      : message.includes("bulunamadı")
        ? 404
        : 422;

    return intelligenceJson(
      {
        success: false,
        message,
      },
      status,
    );
  }
}

export function intelligenceJson(data: unknown, status = 200) {
  return NextResponse.json(serializeForJson(data), { status });
}
