import { NextResponse } from "next/server";
import { z } from "zod";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { prisma } from "@/server/prisma/prisma";

const schema = z.object({ locale: z.enum(["tr-TR", "en-US", "de-DE"]) });

export async function PATCH(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Geçersiz dil." }, { status: 400 });

    let organizationId: string | undefined;
    try {
      const { organization } = await authSessionService.getDashboardContext();
      organizationId = organization.organization.id;
    } catch {
      const tenant = await tenantContextService.resolveFromRequest();
      organizationId = tenant?.id;
    }

    if (!organizationId) return NextResponse.json({ error: "Organizasyon bulunamadı." }, { status: 404 });
    await prisma.organization.update({ where: { id: organizationId }, data: { defaultLocale: parsed.data.locale } });
    return NextResponse.json({ locale: parsed.data.locale });
  } catch {
    return NextResponse.json({ error: "Dil güncellenemedi." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tenant = await tenantContextService.resolveFromRequest();
    return NextResponse.json({ locale: tenant?.defaultLocale ?? "tr-TR" });
  } catch {
    return NextResponse.json({ locale: "tr-TR" });
  }
}
