import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { supportService } from "@/features/support/server/support.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try { const { id } = await params; const { organization, user } = await authSessionService.getDashboardContext(); return NextResponse.json(await supportService.getThread({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id }, id)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Destek talebi alınamadı." }, { status: 404 }); }
}

export async function PATCH(request: Request, { params }: Params) {
  try { const { id } = await params; const { organization, user } = await authSessionService.getDashboardContext(); return NextResponse.json(await supportService.updateTicket({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id }, id, await request.json())); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Destek talebi güncellenemedi." }, { status: 400 }); }
}

