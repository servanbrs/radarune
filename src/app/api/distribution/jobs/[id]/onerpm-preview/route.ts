import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";

type OneRpmPreviewRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const previewDirectory = resolve(".radarune-private/onerpm/automation");

export async function GET(_request: Request, context: OneRpmPreviewRouteContext) {
  return withDistributionActor(async (actor) => {
    const { id } = await context.params;
    const job = await distributionJobService.getJob(actor, id);

    if (!job || job.provider !== "ONE_RPM") {
      return new Response("ONErpm job bulunamadı.", { status: 404 });
    }

    if (job.status !== "MANUAL_REVIEW") {
      return new Response("Bu job için manuel inceleme önizlemesi hazır değil.", { status: 409 });
    }

    let files: string[];
    try {
      files = await readdir(previewDirectory);
    } catch {
      return new Response("ONErpm önizlemesi henüz oluşturulmadı.", { status: 404 });
    }

    const candidates = await Promise.all(
      files
        .filter((file) => file.startsWith(`${id}-`) && file.endsWith(".png"))
        .map(async (file) => ({
          file,
          modifiedAt: (await stat(resolve(previewDirectory, file))).mtimeMs,
        })),
    );
    const latest = candidates.sort((a, b) => b.modifiedAt - a.modifiedAt)[0];

    if (!latest) {
      return new Response("ONErpm önizlemesi henüz oluşturulmadı.", { status: 404 });
    }

    const image = await readFile(resolve(previewDirectory, latest.file));
    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="onerpm-${id}.png"`,
      },
    });
  });
}
