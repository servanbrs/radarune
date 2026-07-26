import { NextResponse } from "next/server";
import { adminPaginationSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";

export async function GET(request: Request) {
  try {
    const actor = await getAdminActor();
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const input = adminPaginationSchema.parse(params);
    const logs = await adminSystemService.listSystemLogs(actor, input);
    return NextResponse.json(logs);
  } catch (error) {
    return adminJsonError(error);
  }
}
