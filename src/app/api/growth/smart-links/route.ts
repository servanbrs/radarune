import { NextResponse } from "next/server";
import { createSmartLinkSchema } from "@/features/growth/schemas/growth.schema";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { smartLinkService } from "@/features/growth/server/services/smart-link.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const input = createSmartLinkSchema.parse(await request.json());
    const result = await smartLinkService.create(actor, input);
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await getGrowthActor();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Smart Link id gerekli." }, { status: 400 });
    const input = createSmartLinkSchema.parse(await request.json());
    return NextResponse.json(await smartLinkService.update(actor, id, input));
  } catch (error) {
    return growthJsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await getGrowthActor();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Smart Link id gerekli." }, { status: 400 });
    return NextResponse.json(await smartLinkService.remove(actor, id));
  } catch (error) {
    return growthJsonError(error);
  }
}
