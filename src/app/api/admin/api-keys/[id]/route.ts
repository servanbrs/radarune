import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { apiKeyService } from "@/features/platform/server/services/api-key.service";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await context.params;
    return NextResponse.json(await apiKeyService.revoke(actor, id));
  } catch (error) {
    return adminJsonError(error);
  }
}
