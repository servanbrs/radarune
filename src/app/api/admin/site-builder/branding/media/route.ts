import { NextResponse } from "next/server";
import { getAdminActor } from "@/features/admin/server/http/admin-route";
import { publicMediaService, type PublicMediaKind } from "@/features/storage/server/services/public-media.service";

export async function POST(request: Request) {
  try {
    const actor = await getAdminActor();
    const form = await request.formData();
    const file = form.get("file");
    const kind = form.get("kind");
    if (!(file instanceof File) || !["LOGO", "FAVICON"].includes(String(kind))) return NextResponse.json({ error: "Geçerli bir logo veya favicon dosyası seçin." }, { status: 422 });
    return NextResponse.json(await publicMediaService.upload({ file, organizationId: actor.organizationId, ownerId: actor.userId, kind: kind as PublicMediaKind }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Favicon yüklenemedi." }, { status: 422 });
  }
}
