import { NextResponse } from "next/server";
import { createCommentSchema } from "@/features/growth/schemas/growth.schema";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { socialService } from "@/features/growth/server/services/social.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const input = createCommentSchema.parse(await request.json());
    const result = await socialService.comment(actor, input);
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}
