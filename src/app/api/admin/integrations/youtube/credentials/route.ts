import { NextResponse } from "next/server";

import {
  adminJsonError,
  getAdminActor,
} from "@/features/admin/server/http/admin-route";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { youtubeAdminCredentialService } from "@/features/integrations/server/services/youtube-admin-credential.service";

export async function GET() {
  try {
    const actor = await getAdminActor();

    assertAdminPermission(
      actor,
      "integrations.youtube.view",
    );

    const status =
      await youtubeAdminCredentialService.getStatus(
        actor.organizationId,
      );

    return NextResponse.json(status);
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getAdminActor();

    assertAdminPermission(
      actor,
      "integrations.youtube.manage",
    );

    const body = (await request.json()) as {
      apiKey?: unknown;
    };

    if (typeof body.apiKey !== "string") {
      return NextResponse.json(
        {
          error: "YouTube API anahtarı gereklidir.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await youtubeAdminCredentialService.save(
        actor.organizationId,
        body.apiKey,
      );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH() {
  try {
    const actor = await getAdminActor();

    assertAdminPermission(
      actor,
      "integrations.youtube.manage",
    );

    const result =
      await youtubeAdminCredentialService.testSaved(
        actor.organizationId,
      );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function DELETE() {
  try {
    const actor = await getAdminActor();

    assertAdminPermission(
      actor,
      "integrations.youtube.manage",
    );

    await youtubeAdminCredentialService.remove(
      actor.organizationId,
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return adminJsonError(error);
  }
}
