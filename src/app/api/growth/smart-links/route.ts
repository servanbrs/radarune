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
