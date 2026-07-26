import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { organizationService } from "@/features/organization/server/services/organization.service";
import { userProfileService } from "@/features/users/server/services/user-profile.service";

export async function PATCH(request: Request) {
  try {
    const session = await authSessionService.getRequiredSession();
    const organization = await organizationService.getOptionalOrganizationContext(session.user.id);
    const body: unknown = await request.json();
    return NextResponse.json(await userProfileService.updateUsername(session.user.id, organization?.organization.id, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kullanıcı adı güncellenemedi.";
    const status = message.includes("Oturum") ? 401 : message.includes("zaten") ? 409 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
