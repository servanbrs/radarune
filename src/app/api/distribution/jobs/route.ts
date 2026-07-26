import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";

export async function GET() {
  return withDistributionActor(async (actor) => {
    const jobs = await distributionJobService.listJobs(actor);

    return distributionJson({
      success: true,
      data: jobs,
    });
  });
}

export async function POST(request: Request) {
  return withDistributionActor(async (actor) => {
    const body = (await request.json()) as {
      provider?: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      payload: {
        organizationId: string;
        releaseId: string;
        releaseVersion: number;
        releaseStatus: "APPROVED";
        title: string;
        subtitle?: string;
        isExistingRelease: boolean;
        upc?: string;
        releaseType: string;
        labelName?: string;
        copyrightLine?: string;
        productionLine?: string;
        releaseDate: string;
        originalReleaseDate?: string;
        artworkUrl: string;
        languageCode?: string;
        explicit: boolean;
        presaveEnabled?: boolean;
        contentIdEnabled?: boolean;
        dolbyAtmosEnabled?: boolean;
        artists: Array<{
          artistId: string;
          name: string;
          role: "PRIMARY" | "FEATURED";
        }>;
        tracks: Array<{
          trackId: string;
          title: string;
          isrc?: string;
          audioFileUrl: string;
          durationSeconds?: number;
          explicit: boolean;
          languageCode?: string;
          contributors: Array<{
            name: string;
            role: string;
          }>;
        }>;
        stores: Array<{
          code: string;
          enabled: boolean;
        }>;
        territories: string[];
      };
    };

    const result = await distributionJobService.createJob(actor, {
      ...(body.provider ? { provider: body.provider } : {}),
      payload: {
        organizationId: body.payload.organizationId,
        releaseId: body.payload.releaseId,
        releaseVersion: body.payload.releaseVersion,
        releaseStatus: body.payload.releaseStatus,
        title: body.payload.title,
        ...(body.payload.subtitle ? { subtitle: body.payload.subtitle } : {}),
        isExistingRelease: body.payload.isExistingRelease,
        ...(body.payload.upc ? { upc: body.payload.upc } : {}),
        releaseType: body.payload.releaseType,
        ...(body.payload.labelName ? { labelName: body.payload.labelName } : {}),
        ...(body.payload.copyrightLine
          ? { copyrightLine: body.payload.copyrightLine }
          : {}),
        ...(body.payload.productionLine
          ? { productionLine: body.payload.productionLine }
          : {}),
        releaseDate: new Date(body.payload.releaseDate),
        ...(body.payload.originalReleaseDate
          ? { originalReleaseDate: new Date(body.payload.originalReleaseDate) }
          : {}),
        artworkUrl: body.payload.artworkUrl,
        ...(body.payload.languageCode ? { languageCode: body.payload.languageCode } : {}),
        explicit: body.payload.explicit,
        presaveEnabled: body.payload.presaveEnabled ?? false,
        contentIdEnabled: body.payload.contentIdEnabled ?? false,
        dolbyAtmosEnabled: body.payload.dolbyAtmosEnabled ?? false,
        artists: body.payload.artists,
        tracks: body.payload.tracks,
        stores: body.payload.stores,
        territories: body.payload.territories,
      },
    });

    return distributionJson(result, result.success ? 200 : 400);
  });
}
