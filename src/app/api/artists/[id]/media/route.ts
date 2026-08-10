import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistProfileService } from "@/features/artist/server/services/artist-profile.service";
import { publicMediaService, type PublicMediaKind } from "@/features/storage/server/services/public-media.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { organization, user } = await authSessionService.getDashboardContext();
    const { id } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const kind = form.get("kind");
    if (!(file instanceof File) || !["PROFILE", "COVER"].includes(String(kind))) return NextResponse.json({ error: "Geçerli bir görsel ve görsel türü seçin." }, { status: 422 });

    await artistProfileService.assertEditable({ organizationId: organization.organization.id, userId: user.id, systemRole: user.systemRole, artistId: id });
    const uploaded = await publicMediaService.upload({ file, organizationId: organization.organization.id, ownerId: user.id, entityId: id, kind: kind as PublicMediaKind });
    const field = kind === "PROFILE" ? "profileImageUrl" : "coverImageUrl";
    await artistProfileService.update({ organizationId: organization.organization.id, userId: user.id, systemRole: user.systemRole, artistId: id, data: { [field]: uploaded.url } });
    return NextResponse.json(uploaded);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Görsel yüklenemedi." }, { status: 422 });
  }
}
