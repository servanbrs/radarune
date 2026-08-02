import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { supportService } from "@/features/support/server/support.service";

export async function GET() {
  try {
    const { organization, user } = await authSessionService.getDashboardContext();
    return NextResponse.json(await supportService.listTickets({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id }));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Destek talepleri alınamadı." }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    const { organization, user } = await authSessionService.getDashboardContext();
    const ticket = await supportService.createTicket({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id }, await request.json());
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Destek talebi oluşturulamadı." }, { status: 400 }); }
}

