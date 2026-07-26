import { NextResponse } from "next/server";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    return NextResponse.json(await importSourceService.moderate(await getAdminActor(), id, body));
  } catch (error) {
    return adminJsonError(error);
  }
}
