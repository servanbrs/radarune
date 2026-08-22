import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { supportService } from "@/features/support/server/support.service";

export async function GET() {
  try {
    const { organization, user } = await authSessionService.getDashboardContext();
    const unread = await supportService.getUnreadCount({
      organizationId: organization.organization.id,
      membershipRole: organization.role,
      systemRole: user.systemRole,
      userId: user.id,
    });
    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ unread: 0 }, { status: 401 });
  }
}
