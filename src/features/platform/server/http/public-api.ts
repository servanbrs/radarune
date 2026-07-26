import "server-only";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { apiKeyService } from "@/features/platform/server/services/api-key.service";

export function publicApiError(error: unknown, requestId?: string) {
  const rawMessage = error instanceof Error ? error.message : "";
  const isAuth = rawMessage.includes("API anahtarı") || rawMessage.includes("tenant bağlamı");
  const isScope = rawMessage.includes("scope");
  const code = isAuth ? "UNAUTHORIZED" : isScope ? "FORBIDDEN" : "REQUEST_FAILED";
  const message = isAuth ? "API anahtarı geçersiz veya yetkisiz." : isScope ? "Bu scope için yetkiniz yok." : "Public API isteği işlenemedi.";
  return NextResponse.json(
    { error: { code, message, details: {} }, requestId: requestId ?? randomUUID() },
    { status: isAuth ? 401 : isScope ? 403 : 422 },
  );
}

export function pagination(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Math.min(100_000, Number(url.searchParams.get("page") ?? "1") || 1));
  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize") ?? "20") || 20));
  return { page, pageSize };
}

export async function authenticatePublicRequest(request: Request, scope: string) {
  const access = await apiKeyService.authenticate(request);
  apiKeyService.assertScope(access.key.scopes, scope);
  return access;
}
