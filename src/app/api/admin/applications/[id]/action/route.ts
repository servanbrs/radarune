import { NextResponse } from "next/server";
import { artistApplicationActionSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { artistApplicationService } from "@/features/admin/server/services/artist-application.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await params;
    const input = artistApplicationActionSchema.parse(await request.json());
    const result = await artistApplicationService.handleAction(actor, id, input);
    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}
