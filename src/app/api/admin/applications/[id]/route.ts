import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { artistApplicationService } from "@/features/admin/server/services/artist-application.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await params;
    const application = await artistApplicationService.getApplication(actor, id);
    if (!application) {
      return NextResponse.json({ error: "Sanatçı başvurusu bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(application);
  } catch (error) {
    return adminJsonError(error);
  }
}
