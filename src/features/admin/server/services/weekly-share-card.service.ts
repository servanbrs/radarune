import "server-only";

import { prisma } from "@/server/prisma/prisma";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { notificationService } from "@/features/admin/server/services/notification.service";

export type WeeklyShareCandidate = {
  releaseId: string;
  title: string;
  artistName: string;
  genre: string;
  status: string;
  likeCount: number;
  artworkUrl: string;
  publishedAt: string | null;
  score: number;
};

export type WeeklyShareCardDto = {
  id: string;
  title: string;
  subtitle: string | null;
  weekStart: string;
  status: string;
  reviewNote: string | null;
  items: WeeklyShareCandidate[];
};

function getWeekStart(date = new Date()) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  const day = value.getUTCDay();
  value.setUTCDate(value.getUTCDate() - ((day + 6) % 7));
  return value;
}

function candidateScore(likeCount: number, publishedAt: Date | null) {
  const ageHours = publishedAt
    ? Math.max(0, (Date.now() - publishedAt.getTime()) / 3_600_000)
    : 24 * 365;
  const freshness = ageHours <= 24 ? 80 : ageHours <= 168 ? 40 : 10;
  return likeCount * 100 + freshness;
}

function toCandidate(release: {
  id: string;
  title: string;
  primaryGenre: string;
  status: string;
  liveAt: Date | null;
  createdAt: Date;
  artists: Array<{ artist: { name: string } }>;
  _count: { releaseLikes: number };
}): WeeklyShareCandidate {
  const publishedAt = release.liveAt ?? release.createdAt;
  return {
    releaseId: release.id,
    title: release.title,
    artistName: release.artists.map(({ artist }) => artist.name).join(", ") || "Radarune sanatçısı",
    genre: release.primaryGenre,
    status: release.status,
    likeCount: release._count.releaseLikes,
    artworkUrl: `/api/public/v1/releases/${release.id}/artwork`,
    publishedAt: publishedAt.toISOString(),
    score: candidateScore(release._count.releaseLikes, publishedAt),
  };
}

export class WeeklyShareCardService {
  async listCandidates(actor: FinanceActorContext) {
    const releases = await prisma.release.findMany({
      where: {
        organizationId: actor.organizationId,
        status: { in: ["APPROVED", "LIVE", "DISTRIBUTED"] },
        tracks: { some: {} },
      },
      orderBy: [{ liveAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        primaryGenre: true,
        status: true,
        liveAt: true,
        createdAt: true,
        artists: {
          orderBy: { sortOrder: "asc" },
          take: 3,
          select: { artist: { select: { name: true } } },
        },
        _count: { select: { releaseLikes: true } },
      },
    });

    return releases
      .map(toCandidate)
      .sort((left, right) => right.score - left.score || right.likeCount - left.likeCount);
  }

  async getDashboard(actor: FinanceActorContext) {
    const weekStart = getWeekStart();
    const [candidates, card] = await Promise.all([
      this.listCandidates(actor),
      prisma.weeklyShareCard.findUnique({
        where: { organizationId_weekStart: { organizationId: actor.organizationId, weekStart } },
        include: {
          items: {
            orderBy: { rank: "asc" },
            include: {
              release: {
                select: {
                  id: true,
                  title: true,
                  primaryGenre: true,
                  status: true,
                  liveAt: true,
                  createdAt: true,
                  artists: { orderBy: { sortOrder: "asc" }, take: 3, select: { artist: { select: { name: true } } } },
                  _count: { select: { releaseLikes: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      weekStart: weekStart.toISOString(),
      candidates,
      card: card
        ? {
            id: card.id,
            title: card.title,
            subtitle: card.subtitle,
            weekStart: card.weekStart.toISOString(),
            status: card.status,
            reviewNote: card.reviewNote,
            items: card.items.map((item) => toCandidate(item.release)),
          }
        : null,
    };
  }

  async save(actor: FinanceActorContext, input: { releaseIds: string[]; title?: string; subtitle?: string; submit: boolean }) {
    const releaseIds = [...new Set(input.releaseIds)].slice(0, 5);
    if (releaseIds.length < 1 || releaseIds.length > 5) throw new Error("Haftalık kart için 1 ile 5 yayın seçmelisiniz.");

    const candidates = await this.listCandidates(actor);
    const allowed = new Set(candidates.map((candidate) => candidate.releaseId));
    if (releaseIds.some((id) => !allowed.has(id))) throw new Error("Seçilen yayınlardan biri artık paylaşım için uygun değil.");

    const weekStart = getWeekStart();
    const existing = await prisma.weeklyShareCard.findUnique({
      where: { organizationId_weekStart: { organizationId: actor.organizationId, weekStart } },
      select: { id: true, status: true },
    });
    if (existing?.status === "APPROVED") throw new Error("Bu haftanın kartı zaten onaylandı; yeni kart gelecek hafta oluşturulabilir.");

    const selected = releaseIds.map((id) => candidates.find((candidate) => candidate.releaseId === id)).filter(Boolean) as WeeklyShareCandidate[];
    const card = await prisma.$transaction(async (tx) => {
      const saved = await tx.weeklyShareCard.upsert({
        where: { organizationId_weekStart: { organizationId: actor.organizationId, weekStart } },
        update: {
          title: input.title?.trim() || "Radarune haftanın ilk 5 yayını",
          subtitle: input.subtitle?.trim() || "Bu haftanın en çok etkileşim alan yayınları",
          status: input.submit ? "PENDING_REVIEW" : "DRAFT",
          cardData: selected,
          reviewNote: null,
          reviewedAt: null,
          reviewedByUserId: null,
        },
        create: {
          organizationId: actor.organizationId,
          createdByUserId: actor.userId,
          weekStart,
          title: input.title?.trim() || "Radarune haftanın ilk 5 yayını",
          subtitle: input.subtitle?.trim() || "Bu haftanın en çok etkileşim alan yayınları",
          status: input.submit ? "PENDING_REVIEW" : "DRAFT",
          cardData: selected,
        },
      });
      await tx.weeklyShareCardItem.deleteMany({ where: { cardId: saved.id } });
      await tx.weeklyShareCardItem.createMany({ data: releaseIds.map((releaseId, index) => ({ cardId: saved.id, releaseId, rank: index + 1 })) });
      return saved;
    });

    if (input.submit) {
      await notificationService.notifyStaff({
        organizationId: actor.organizationId,
        type: "WEEKLY_SHARE_CARD_REVIEW",
        title: "Haftalık paylaşım kartı onay bekliyor",
        message: "Haftanın ilk 5 yayını için hazırlanan paylaşım kartı admin onayına gönderildi.",
        entityType: "WeeklyShareCard",
        entityId: card.id,
      });
    }
    return card;
  }

  async review(actor: FinanceActorContext, input: { cardId: string; decision: "APPROVED" | "REJECTED"; note?: string }) {
    const card = await prisma.weeklyShareCard.findFirst({ where: { id: input.cardId, organizationId: actor.organizationId } });
    if (!card) throw new Error("Paylaşım kartı bulunamadı.");
    if (card.status !== "PENDING_REVIEW") throw new Error("Bu kart artık onay kuyruğunda değil.");
    return prisma.weeklyShareCard.update({
      where: { id: card.id },
      data: { status: input.decision, reviewNote: input.note?.trim() || null, reviewedAt: new Date(), reviewedByUserId: actor.userId },
      select: { id: true, status: true },
    });
  }
}

export const weeklyShareCardService = new WeeklyShareCardService();
