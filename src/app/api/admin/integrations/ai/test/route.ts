import { NextResponse } from "next/server";

import {
  canAccessAdmin,
} from "@/features/admin/server/admin-context";
import {
  adminJsonError,
  getAdminActor,
} from "@/features/admin/server/http/admin-route";
import {
  aiProviderKeySchema,
  testAiProviderSchema,
} from "@/features/ai-provider/schemas/ai-provider.schema";
import { aiProviderCredentialService } from "@/features/ai-provider/server/services/ai-provider-credential.service";

export async function POST(
  request: Request,
) {
  try {
    const actor = await getAdminActor();

    if (!canAccessAdmin(actor)) {
      throw new Error(
        "AI bağlantısını test etmek için admin yetkisi gereklidir.",
      );
    }

    const body = await request.json();

    const result =
      body.useSavedCredential === true
        ? await aiProviderCredentialService.testSaved(
            actor.organizationId,
            aiProviderKeySchema.parse(
              body.provider,
            ),
          )
        : await aiProviderCredentialService.test(
            testAiProviderSchema.parse(
              body,
            ),
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
