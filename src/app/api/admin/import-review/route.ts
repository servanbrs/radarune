import { NextResponse } from "next/server";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

export async function GET() {
  try {
    return NextResponse.json(await importSourceService.listReviewItems(await getAdminActor()));
  } catch (error) {
    return adminJsonError(error);
  }
}
