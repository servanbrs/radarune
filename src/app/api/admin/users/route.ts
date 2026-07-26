import { NextResponse } from "next/server";
import { adminPaginationSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export async function GET(request: Request) {
  try {
    const actor = await getAdminActor();
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const input = adminPaginationSchema.parse(params);
    const users = await adminUserService.listUsers(actor, {
      page: input.page,
      pageSize: input.pageSize,
      ...(input.search ? { search: input.search } : {}),
    });
    return NextResponse.json(users);
  } catch (error) {
    return adminJsonError(error);
  }
}
