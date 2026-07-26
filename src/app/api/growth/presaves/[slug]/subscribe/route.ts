import { NextResponse } from "next/server";
import { preSaveEmailSubscribeSchema } from "@/features/growth/schemas/growth.schema";
import { growthJsonError } from "@/features/growth/server/http/growth-route";
import { preSaveService } from "@/features/growth/server/services/presave.service";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const input = preSaveEmailSubscribeSchema.parse(await request.json());
    const result = await preSaveService.subscribeByEmail(slug, input);
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}
