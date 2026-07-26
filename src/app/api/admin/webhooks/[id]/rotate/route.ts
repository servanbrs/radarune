import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { webhookEndpointService } from "@/features/platform/server/services/webhook-endpoint.service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await context.params;
    return NextResponse.json(await webhookEndpointService.rotateSecret(actor, id));
  } catch (error) {
    return adminJsonError(error);
  }
}
