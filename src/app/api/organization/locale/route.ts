import { NextResponse } from "next/server";
import { z } from "zod";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";

const schema = z.object({ locale: z.enum(["tr-TR", "en-US", "de-DE"]) });

export async function PATCH(request: Request) {
  try {
    const { organization } = await authSessionService.getDashboardContext();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Geçersiz dil." }, { status: 400 });
    await prisma.organization.update({ where: { id: organization.organization.id }, data: { defaultLocale: parsed.data.locale } });
    return NextResponse.json({ locale: parsed.data.locale });
  } catch {
    return NextResponse.json({ error: "Dil güncellenemedi." }, { status: 500 });
  }
}
