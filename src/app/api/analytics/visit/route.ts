import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { hashPrivacyValue } from "@/features/growth/server/security.server";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { prisma } from "@/server/prisma/prisma";

function firstHeader(headerList: Headers, names: string[]) {
  for (const name of names) {
    const value = headerList.get(name)?.split(",")[0]?.trim();
    if (value) return value;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.slice(0, 512) : "/";
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.slice(0, 128) : null;
    if (!visitorId) return new NextResponse(null, { status: 204 });

    const headerList = await headers();
    const userAgent = headerList.get("user-agent")?.slice(0, 512) ?? null;
    if (/bot|crawler|spider|slurp|headless/i.test(userAgent ?? "")) {
      return new NextResponse(null, { status: 204 });
    }

    const tenant = await tenantContextService.resolveFromRequest();
    if (!tenant) return new NextResponse(null, { status: 204 });

    const session = await authSessionService.getOptionalSession();
    const ipAddress = firstHeader(headerList, ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"]);
    const country = firstHeader(headerList, ["cf-ipcountry", "x-vercel-ip-country", "x-country-code", "x-forwarded-country"]);
    const city = firstHeader(headerList, ["x-vercel-ip-city", "x-city", "x-forwarded-city"]);

    await prisma.siteVisit.create({
      data: {
        organizationId: tenant.id,
        userId: session?.user.id ?? null,
        visitorHash: hashPrivacyValue(visitorId),
        ipHash: ipAddress ? hashPrivacyValue(ipAddress) : null,
        country: country?.toUpperCase() ?? null,
        city,
        path,
        userAgent,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SITE_VISIT] Ziyaret kaydı yazılamadı:", error);
    return new NextResponse(null, { status: 204 });
  }
}
