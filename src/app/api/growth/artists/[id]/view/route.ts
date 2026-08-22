import { NextResponse } from "next/server";
import { hashPrivacyValue } from "@/features/growth/server/security.server";
import { prisma } from "@/server/prisma/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await prisma.artist.findFirst({
    where: { id, profilePublishedAt: { not: null } },
    select: { id: true, organizationId: true },
  });
  if (!artist) return NextResponse.json({ ok: false }, { status: 404 });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") ?? "";
  const visitorHash = hashPrivacyValue(`${ip}:${userAgent}`);
  const recentSince = new Date(Date.now() - 30 * 60 * 1000);
  const alreadyRecorded = await prisma.discoverEvent.findFirst({
    where: {
      organizationId: artist.organizationId,
      artistId: artist.id,
      eventType: "PROFILE_OPEN",
      visitorHash,
      createdAt: { gte: recentSince },
    },
    select: { id: true },
  });
  if (!alreadyRecorded) {
    await prisma.discoverEvent.create({
      data: {
        organizationId: artist.organizationId,
        artistId: artist.id,
        visitorHash,
        eventType: "PROFILE_OPEN",
      },
      select: { id: true },
    });
  }
  return NextResponse.json({ ok: true });
}
