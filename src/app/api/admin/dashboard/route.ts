import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { adminDashboardService } from "@/features/admin/server/services/admin-dashboard.service";

export async function GET() {
  try {
    const actor = await getAdminActor();
    const dashboard = await adminDashboardService.getDashboard(actor);
    return NextResponse.json(dashboard);
  } catch (error) {
    return adminJsonError(error);
  }
}
