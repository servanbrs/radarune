import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { releaseModerationService } from "@/features/admin/server/services/release-moderation.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await params;
    const release = await releaseModerationService.getRelease(actor, id);
    if (!release) {
      return NextResponse.json({ error: "Yayın bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(release);
  } catch (error) {
    return adminJsonError(error);
  }
}
