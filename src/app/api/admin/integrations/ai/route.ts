import { NextResponse } from "next/server";

import {
  canAccessAdmin,
} from "@/features/admin/server/admin-context";
import {
  adminJsonError,
  getAdminActor,
} from "@/features/admin/server/http/admin-route";
import { aiProviderCredentialService } from "@/features/ai-provider/server/services/ai-provider-credential.service";

function assertAiAdmin(
  actor: Awaited<
    ReturnType<typeof getAdminActor>
  >,
) {
  if (!canAccessAdmin(actor)) {
    throw new Error(
      "AI sağlayıcılarını yönetmek için admin yetkisi gereklidir.",
    );
  }
}

export async function GET() {
  try {
    const actor = await getAdminActor();
    assertAiAdmin(actor);

    const providers =
      await aiProviderCredentialService.list(
        actor.organizationId,
      );

    return NextResponse.json({
      success: true,
      providers,
    });
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(
  request: Request,
) {
  try {
    const actor = await getAdminActor();
    assertAiAdmin(actor);

    const result =
      await aiProviderCredentialService.save(
        actor.organizationId,
        await request.json(),
      );

    return NextResponse.json(
      result,
      {
        status: result.success
          ? 200
          : 400,
      },
    );
  } catch (error) {
    return adminJsonError(error);
  }
}
