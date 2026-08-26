import { NextResponse } from "next/server";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const entries = Array.isArray(body) ? body : body?.items;
    return NextResponse.json(await importSourceService.importOneRpmCatalog(await getAdminActor(), (await params).id, entries));
  } catch (error) { return adminJsonError(error); }
}
