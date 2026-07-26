import { NextResponse } from "next/server";
import { financeActorService } from "@/features/finance/server/services/finance-actor.service";
import { serializeForJson } from "@/features/finance/server/lib/serializers";

export async function withDistributionActor(
  handler: (actor: NonNullable<Awaited<ReturnType<typeof financeActorService.getOptionalRouteActor>>>) => Promise<Response>,
) {
  const actor = await financeActorService.getOptionalRouteActor();

  if (!actor) {
    return NextResponse.json(
      {
        success: false,
        message: "Oturum bulunamadı.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    return await handler(actor);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
    const status =
      message.includes("yetkiniz yok") || message.includes("görüntüleyemezsiniz")
        ? 403
        : 400;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status,
      },
    );
  }
}

export function distributionJson(data: unknown, status = 200) {
  return NextResponse.json(serializeForJson(data), {
    status,
  });
}
