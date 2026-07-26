import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await params;
    const user = await adminUserService.getUser(actor, id);
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return adminJsonError(error);
  }
}
