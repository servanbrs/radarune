import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { userDeletionService } from "@/features/users/server/services/user-deletion.service";

export async function GET() {
  try {
    return NextResponse.json(await userDeletionService.list(await getAdminActor()));
  } catch (error) {
    return adminJsonError(error);
  }
}
