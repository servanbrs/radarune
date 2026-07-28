import { NextResponse } from "next/server";
import { createArtistApplicationSchema } from "@/features/admin/schemas/admin.schema";
import { financeActorService } from "@/features/finance/server/services/finance-actor.service";
import { artistApplicationService } from "@/features/admin/server/services/artist-application.service";

export async function POST(request: Request) {
  const actor = await financeActorService.getOptionalRouteActor();
  if (!actor) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  const parsed = createArtistApplicationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Başvuru bilgileri geçerli değil." }, { status: 422 });

  const result = await artistApplicationService.createApplication(actor, parsed.data);
  return NextResponse.json(result, { status: result.success ? 201 : 409 });
}
