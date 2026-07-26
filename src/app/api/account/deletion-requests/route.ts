import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { userDeletionService } from "@/features/users/server/services/user-deletion.service";

export async function POST(request: Request) {
  try {
    const { organization, session } = await authSessionService.getDashboardContext();
    const result = await userDeletionService.request(session.user.id, organization.organization.id, await request.json());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Silme talebi oluşturulamadı." }, { status: 422 });
  }
}
