import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { smartLinkService } from "@/features/growth/server/services/smart-link.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const links = await smartLinkService.list(actor);

    return mobileJson(links, requestId);
  });
}

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const smartLink = await smartLinkService.create(actor, await request.json());

    return mobileJson(smartLink, requestId, 201);
  });
}
