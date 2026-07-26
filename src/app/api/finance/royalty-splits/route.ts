import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";

export async function POST(request: Request) {
  return withFinanceActor(async (actor) => {
    const body = (await request.json()) as {
      releaseTitle?: string;
      splits: Array<{
        artistId?: string;
        beneficiaryUserId?: string;
        labelId?: string;
        participantName: string;
        percentageBps: number;
        role: "LABEL" | "ARTIST" | "PRODUCER" | "COMPOSER" | "LYRICIST" | "MANAGER";
      }>;
      trackKey: string;
      trackTitle: string;
    };

    const result = await royaltyEngineService.createTrackSplits(actor, body);

    return financeJson(result);
  });
}
