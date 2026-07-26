import { NextResponse } from "next/server";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

export async function GET() {
  try {
    return NextResponse.json(await importSourceService.list(await getAdminActor()));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    return NextResponse.json(await importSourceService.create(await getAdminActor(), body), { status: 201 });
  } catch (error) {
    return adminJsonError(error);
  }
}
