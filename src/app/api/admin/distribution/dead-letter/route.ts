import { NextResponse } from "next/server";

import {
  getAdminActor,
  adminJsonError,
} from "@/features/admin/server/http/admin-route";
import { deadLetterListQuerySchema } from "@/features/distribution-hub/schemas/distribution-operations.schema";
import { distributionOperationsService } from "@/features/distribution-hub/server/services/distribution-operations.service";

export async function GET(request: Request) {
  try {
    const actor = await getAdminActor();
    const searchParams = new URL(request.url).searchParams;

    const input = deadLetterListQuerySchema.parse({
      take: searchParams.get("take") ?? undefined,
    });

    const jobs =
      await distributionOperationsService.listDeadLetterJobs(
        actor,
        input.take,
      );

    return NextResponse.json({
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    return adminJsonError(error);
  }
}
