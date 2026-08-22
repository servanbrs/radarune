import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { rbacService } from "@/features/authorization/server/rbac";
import { getOneRpmSessionStatus } from "@/features/distribution-automation/server/onerpm-session.service";

export async function GET() {
  return withDistributionActor(async (actor) => {
    const canView =
      actor.membershipRole === "OWNER" ||
      rbacService.hasEffectivePermission({
        membershipRole: actor.membershipRole,
        permission: "distribution:view",
        systemRole: actor.systemRole,
      });

    if (!canView) {
      return distributionJson(
        { success: false, message: "ONErpm oturum durumunu görüntüleme yetkiniz yok." },
        403,
      );
    }

    return distributionJson({
      success: true,
      data: await getOneRpmSessionStatus(),
    });
  });
}
