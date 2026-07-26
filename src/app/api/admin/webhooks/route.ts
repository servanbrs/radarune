import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { webhookEndpointService } from "@/features/platform/server/services/webhook-endpoint.service";
import type { WebhookEndpointCreateInput } from "@/features/platform/schemas/platform.schema";

export async function GET() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await webhookEndpointService.list(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getAdminActor();
    const body: unknown = await request.json();
    return NextResponse.json(await webhookEndpointService.create(actor, body as WebhookEndpointCreateInput), { status: 201 });
  } catch (error) {
    return adminJsonError(error);
  }
}
