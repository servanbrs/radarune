import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { mobileAuthService } from "@/features/mobile/server/services/mobile-auth.service";
import { serializeForJson } from "@/features/finance/server/lib/serializers";

export type MobileRouteActor = NonNullable<Awaited<ReturnType<typeof mobileAuthService.getActorFromRequest>>>;

function createRequestId() {
  return crypto.randomUUID();
}

function statusFromMessage(message: string) {
  if (message.includes("Oturum") || message.includes("token")) return 401;
  if (message.includes("yetkiniz")) return 403;
  if (message.includes("bulunamadı")) return 404;
  if (message.includes("çakış")) return 409;
  if (message.includes("limit") || message.includes("entitlement")) return 403;
  return 422;
}

export function mobileJson<TData>(data: TData, requestId: string, status = 200, meta: Record<string, unknown> = {}) {
  return NextResponse.json(serializeForJson({ data, meta, requestId }), { status });
}

export function mobileNoContent() {
  return new Response(null, { status: 204 });
}

export function mobileError(error: unknown, requestId: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Gönderilen bilgiler geçersiz.",
          fields: error.flatten().fieldErrors,
        },
        requestId,
      },
      { status: 422 },
    );
  }

  const message = error instanceof Error ? error.message : "Mobil API işlemi başarısız oldu.";
  const status = statusFromMessage(message);
  return NextResponse.json(
    {
      error: {
        code: status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : status === 409 ? "CONFLICT" : "VALIDATION_ERROR",
        message,
      },
      requestId,
    },
    { status },
  );
}

export async function withMobileActor(handler: (actor: MobileRouteActor, requestId: string) => Promise<Response>) {
  const requestId = createRequestId();

  try {
    const actor = await mobileAuthService.getActorFromRequest();
    if (!actor) {
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: "Oturum bulunamadı." },
          requestId,
        },
        { status: 401 },
      );
    }
    return await handler(actor, requestId);
  } catch (error) {
    return mobileError(error, requestId);
  }
}

export async function withMobilePublic(handler: (requestId: string) => Promise<Response>) {
  const requestId = createRequestId();

  try {
    return await handler(requestId);
  } catch (error) {
    return mobileError(error, requestId);
  }
}
