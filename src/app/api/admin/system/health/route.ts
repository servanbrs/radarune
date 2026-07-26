import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { systemHealthService } from "@/features/platform/server/services/system-health.service";

export async function GET() {
  try {
    return NextResponse.json(await systemHealthService.run(await getAdminActor()));
  } catch (error) {
    return adminJsonError(error);
  }
}
