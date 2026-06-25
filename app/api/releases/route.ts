import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const release = await prisma.release.create({
      data: {
        trackTitle: body.trackTitle,
        artistName: body.artistName,
        genre: body.genre,
        language: body.language,
        explicit: body.explicit,
        status: "pending",
      },
    });

    return NextResponse.json(release);
  } catch (error) {
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}