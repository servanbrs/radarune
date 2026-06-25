import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const release = await prisma.release.update({
    where: {
      id: Number(id),
    },
    data: {
      status: body.status,
      reviewNotes: body.reviewNotes || null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(release);
}