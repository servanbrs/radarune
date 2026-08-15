import { NextResponse } from "next/server";
import { updateUserRoleSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await params;
    const body = await request.json() as { role?: unknown; reason?: unknown };
    const input = updateUserRoleSchema.parse({
      role: typeof body.role === "string" ? body.role.trim().toUpperCase() : body.role,
      reason:
        typeof body.reason === "string" && body.reason.trim().length >= 10
          ? body.reason.trim()
          : "Admin kullanıcı yetkilendirmesi güncellendi.",
    });
    const result = await adminUserService.updateRole(actor, id, input);
    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}
