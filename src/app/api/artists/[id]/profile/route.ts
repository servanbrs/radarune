import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistProfileService } from "@/features/artist/server/services/artist-profile.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { organization } = await authSessionService.getDashboardContext();
    const { id } = await context.params;
    const artist = await artistProfileService.get(organization.organization.id, id);
    if (!artist) return NextResponse.json({ error: "Sanatçı bulunamadı." }, { status: 404 });
    return NextResponse.json(artist);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sanatçı profili alınamadı." }, { status: 422 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { organization, user } = await authSessionService.getDashboardContext();
    const { id } = await context.params;
    const artist = await artistProfileService.update({ organizationId: organization.organization.id, userId: user.id, systemRole: user.systemRole, artistId: id, data: await request.json() });
    return NextResponse.json(artist);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sanatçı profili güncellenemedi.";
    const status = message.includes("yetkiniz") ? 403 : message.includes("bulunamadı") ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
