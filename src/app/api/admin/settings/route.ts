import { NextResponse } from "next/server";
import { updateAdminSettingSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";

export async function GET() {
  try {
    const actor = await getAdminActor();
    const result = await adminSystemService.listSettings(actor);
    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getAdminActor();
    const input = updateAdminSettingSchema.parse(await request.json());
    const result = await adminSystemService.updateSetting(actor, input);
    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}
