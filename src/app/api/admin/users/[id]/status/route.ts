import { NextResponse } from "next/server";
import { updateUserStatusSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await params;
    const input = updateUserStatusSchema.parse(await request.json());
    const result = await adminUserService.updateStatus(actor, id, input);
    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}
