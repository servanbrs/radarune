import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { supportService } from "@/features/support/server/support.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const { organization, user } = await authSessionService.getDashboardContext(); return NextResponse.json(await supportService.addMessage({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id }, id, await request.json())); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Mesaj gönderilemedi." }, { status: 400 }); }
}

