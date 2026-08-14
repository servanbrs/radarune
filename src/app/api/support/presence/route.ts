import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { supportService } from "@/features/support/server/support.service";

export async function GET() {
  try {
    await authSessionService.getDashboardContext();
    return NextResponse.json(await supportService.getStaffPresence());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Destek ekibi durumu alınamadı." },
      { status: 401 },
    );
  }
}
