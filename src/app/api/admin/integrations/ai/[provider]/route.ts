import { NextResponse } from "next/server";

import {
  canAccessAdmin,
} from "@/features/admin/server/admin-context";
import {
  adminJsonError,
  getAdminActor,
} from "@/features/admin/server/http/admin-route";
import { aiProviderKeySchema } from "@/features/ai-provider/schemas/ai-provider.schema";
import { aiProviderCredentialService } from "@/features/ai-provider/server/services/ai-provider-credential.service";

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const actor = await getAdminActor();

    if (!canAccessAdmin(actor)) {
      throw new Error(
        "AI sağlayıcısını kaldırmak için admin yetkisi gereklidir.",
      );
    }

    const { provider } =
      await context.params;

    const parsedProvider =
      aiProviderKeySchema.parse(
        provider,
      );

    const result =
      await aiProviderCredentialService.remove(
        actor.organizationId,
        parsedProvider,
      );

    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}
