import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { storageService } from "@/features/storage/server/services/storage.service";

export async function GET() {
  try {
    const actor = await getAdminActor();
    assertAdminPermission(actor, "storage.view");
    return NextResponse.json(storageService.getStatus());
  } catch (error) {
    return adminJsonError(error);
  }
}
