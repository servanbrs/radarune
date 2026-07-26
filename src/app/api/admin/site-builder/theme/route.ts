import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { themeService } from "@/features/platform/server/services/theme.service";
import type { ThemeUpdateInput } from "@/features/platform/schemas/platform.schema";

export async function GET() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await themeService.get(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getAdminActor();
    const body: unknown = await request.json();
    return NextResponse.json(await themeService.update(actor, body as ThemeUpdateInput));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await themeService.publish(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}
