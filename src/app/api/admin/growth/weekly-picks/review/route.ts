import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { weeklyShareCardService } from "@/features/admin/server/services/weekly-share-card.service";

export async function POST(request: Request) {
  try {
    const actor = await getAdminActor();
    if (actor.systemRole !== "ADMIN" && actor.systemRole !== "SUPER_ADMIN") throw new Error("Bu alan yalnızca admin onayı için kullanılabilir.");
    assertAdminPermission(actor, "releases:review");
    const body = await request.json() as { cardId?: unknown; decision?: unknown; note?: unknown };
    if (typeof body.cardId !== "string" || (body.decision !== "APPROVED" && body.decision !== "REJECTED")) throw new Error("Geçerli bir onay kararı gönderin.");
    const input: { cardId: string; decision: "APPROVED" | "REJECTED"; note?: string } = {
      cardId: body.cardId,
      decision: body.decision,
    };
    if (typeof body.note === "string") input.note = body.note;
    return NextResponse.json(await weeklyShareCardService.review(actor, input));
  } catch (error) {
    return adminJsonError(error);
  }
}
