import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { preSaveService } from "@/features/growth/server/services/presave.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const campaigns = await preSaveService.list(actor);

    return mobileJson(campaigns, requestId);
  });
}

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const campaign = await preSaveService.create(actor, await request.json());

    return mobileJson(campaign, requestId, 201);
  });
}
