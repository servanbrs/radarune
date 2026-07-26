import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { PlaybackEventInput } from "@/features/mobile/contracts/mobile-api.contract";
import type { MobileRouteActor } from "@/features/mobile/server/http/mobile-route";

const minimumStreamMilliseconds = 30_000;

export class MobilePlayerService {
  async getPlayback(actor: MobileRouteActor, trackId: string) {
    const track = await prisma.track.findFirst({
      where: {
        id: trackId,
        release: {
          organizationId: actor.organizationId,
          status: { in: ["LIVE", "DISTRIBUTED", "APPROVED"] },
        },
      },
      include: { release: true, uploads: true, artists: { include: { artist: true } } },
    });

    if (!track) {
      throw new Error("Playback için track bulunamadı.");
    }

    const upload = track.uploads.find((entry) => entry.id === track.audioUploadId);
    if (!upload) {
      throw new Error("Playback URL üretilecek ses dosyası bulunamadı.");
    }

    return {
      track: {
        id: track.id,
        title: track.title,
        durationMs: track.durationMs,
        artists: track.artists.map((artist) => artist.artist.name),
      },
      playback: {
        url: `/api/v1/mobile/tracks/${track.id}/playback-stream`,
        expiresInSeconds: 900,
      },
    };
  }

  async recordEvent(actor: MobileRouteActor, input: PlaybackEventInput) {
    const track = await prisma.track.findFirst({
      where: { id: input.trackId, organizationId: actor.organizationId },
      select: { id: true },
    });
    if (!track) {
      throw new Error("Track bulunamadı.");
    }

    const shouldCountStream = input.listenedMilliseconds >= minimumStreamMilliseconds;
    return prisma.playbackSession.upsert({
      where: { sessionId: input.sessionId },
      update: {
        listenedMilliseconds: Math.max(0, input.listenedMilliseconds),
        completed: input.completed,
        ...(shouldCountStream ? { streamCountedAt: new Date() } : {}),
      },
      create: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        sessionId: input.sessionId,
        trackId: input.trackId,
        source: input.source,
        listenedMilliseconds: input.listenedMilliseconds,
        completed: input.completed,
        ...(shouldCountStream ? { streamCountedAt: new Date() } : {}),
      },
      select: { sessionId: true, listenedMilliseconds: true, completed: true, streamCountedAt: true },
    });
  }
}

export const mobilePlayerService = new MobilePlayerService();
