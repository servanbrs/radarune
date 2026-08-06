import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { whatsappNotificationService } from "@/features/integrations/server/services/whatsapp-notification.service";

export async function POST() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await whatsappNotificationService.sendTest(actor.organizationId));
  } catch (error) { return adminJsonError(error); }
}
