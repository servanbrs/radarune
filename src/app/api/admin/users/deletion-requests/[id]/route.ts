import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { userDeletionService } from "@/features/users/server/services/user-deletion.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await context.params;
    return NextResponse.json(await userDeletionService.act(actor, id, await request.json()));
  } catch (error) {
    return adminJsonError(error);
  }
}
