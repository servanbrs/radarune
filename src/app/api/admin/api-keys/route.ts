import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { apiKeyService } from "@/features/platform/server/services/api-key.service";
import type { ApiKeyCreateInput } from "@/features/platform/schemas/platform.schema";

export async function GET() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await apiKeyService.list(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getAdminActor();
    const body: unknown = await request.json();
    return NextResponse.json(await apiKeyService.create(actor, body as ApiKeyCreateInput), { status: 201 });
  } catch (error) {
    return adminJsonError(error);
  }
}
