import { z } from "zod";

import { rbacService } from "@/features/authorization/server/rbac";
import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import {
  cancelOneRpmBrowserConnection,
  completeOneRpmBrowserConnection,
  startOneRpmBrowserConnection,
} from "@/features/distribution-automation/server/onerpm-browser-connection.service";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), email: z.string().email(), password: z.string().min(1).max(512) }),
  z.object({ action: z.literal("verify"), connectionId: z.string().uuid(), code: z.string().regex(/^\d{4,10}$/) }),
  z.object({ action: z.literal("cancel"), connectionId: z.string().uuid() }),
]);

export async function POST(request: Request) {
  return withDistributionActor(async (actor) => {
    if (
      actor.membershipRole !== "OWNER" &&
      !rbacService.hasEffectivePermission({
        membershipRole: actor.membershipRole,
        permission: "distribution:manage",
        systemRole: actor.systemRole,
      })
    ) {
      throw new Error("ONErpm bağlantısını yönetme yetkiniz yok.");
    }
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return distributionJson({ success: false, message: "Bağlantı bilgileri geçersiz." }, 400);

    const result = parsed.data.action === "start"
      ? await startOneRpmBrowserConnection(parsed.data.email, parsed.data.password)
      : parsed.data.action === "verify"
        ? await completeOneRpmBrowserConnection(parsed.data.connectionId, parsed.data.code)
        : await cancelOneRpmBrowserConnection(parsed.data.connectionId);

    return distributionJson(result, result.success || result.status === "WAITING_2FA" || result.status === "WAITING_LOGIN" ? 200 : 400);
  });
}
