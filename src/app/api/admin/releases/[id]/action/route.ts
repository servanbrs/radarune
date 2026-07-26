import { NextResponse } from "next/server";
import { releaseModerationActionSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { releaseModerationService } from "@/features/admin/server/services/release-moderation.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await params;
    const input = releaseModerationActionSchema.parse(await request.json());
    const result = await releaseModerationService.handleAction(actor, id, input);
    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}
