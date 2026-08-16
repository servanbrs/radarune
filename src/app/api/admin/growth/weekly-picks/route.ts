import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { weeklyShareCardService } from "@/features/admin/server/services/weekly-share-card.service";

export async function GET() {
  try {
    const actor = await getAdminActor();
    if (actor.systemRole !== "ADMIN" && actor.systemRole !== "SUPER_ADMIN") throw new Error("Bu alan yalnızca admin onayı için kullanılabilir.");
    assertAdminPermission(actor, "releases:view");
    return NextResponse.json(await weeklyShareCardService.getDashboard(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getAdminActor();
    if (actor.systemRole !== "ADMIN" && actor.systemRole !== "SUPER_ADMIN") throw new Error("Bu alan yalnızca admin onayı için kullanılabilir.");
    assertAdminPermission(actor, "releases:review");
    const body = await request.json() as { releaseIds?: unknown; title?: unknown; subtitle?: unknown; submit?: unknown };
    if (!Array.isArray(body.releaseIds) || body.releaseIds.some((id) => typeof id !== "string")) throw new Error("Geçerli yayın seçimleri gönderin.");
    const input: { releaseIds: string[]; submit: boolean; title?: string; subtitle?: string } = {
      releaseIds: body.releaseIds,
      submit: body.submit === true,
    };
    if (typeof body.title === "string") input.title = body.title;
    if (typeof body.subtitle === "string") input.subtitle = body.subtitle;
    const card = await weeklyShareCardService.save(actor, input);
    return NextResponse.json({ id: card.id, status: card.status });
  } catch (error) {
    return adminJsonError(error);
  }
}
