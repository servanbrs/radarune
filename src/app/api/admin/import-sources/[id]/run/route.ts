import { NextResponse } from "next/server";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return NextResponse.json(await importSourceService.run(await getAdminActor(), id));
  } catch (error) {
    return adminJsonError(error);
  }
}
