import { NextResponse } from "next/server";

import {
  getAdminActor,
  adminJsonError,
} from "@/features/admin/server/http/admin-route";
import { distributionJobIdSchema } from "@/features/distribution-hub/schemas/distribution-operations.schema";
import { distributionOperationsService } from "@/features/distribution-hub/server/services/distribution-operations.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const actor = await getAdminActor();
    const { id } = await context.params;
    const jobId = distributionJobIdSchema.parse(id);

    const job =
      await distributionOperationsService.requeueDeadLetterJob(
        actor,
        jobId,
      );

    if (!job) {
      return NextResponse.json(
        {
          error:
            "Manuel incelemede olan distribution job bulunamadı.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Distribution job tekrar kuyruğa alındı.",
      job,
    });
  } catch (error) {
    return adminJsonError(error);
  }
}
