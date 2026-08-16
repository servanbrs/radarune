import "server-only";

import { prisma } from "@/server/prisma/prisma";

const REWARD_SETTING_KEYS = [
  "REWARD_EMAIL_VERIFICATION_REQUIRED",
  "REWARD_MIN_ACTIVE_DAYS",
  "REWARD_REAL_INTERACTION_REQUIRED",
] as const;

export type RewardEligibilityRules = {
  emailVerificationRequired: boolean;
  minActiveDays: number;
  realInteractionRequired: boolean;
};

export type RewardEligibilityCheck = {
  key: "emailVerification" | "activeDays" | "realInteraction";
  label: string;
  passed: boolean;
  detail: string;
};

export type RewardEligibilityResult = {
  eligible: boolean;
  userId: string;
  rules: RewardEligibilityRules;
  checks: RewardEligibilityCheck[];
};

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNonNegativeInteger(value: unknown, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.floor(numberValue)
    : fallback;
}

class RewardEligibilityService {
  async getRules(organizationId: string): Promise<RewardEligibilityRules> {
    const settings = await prisma.adminSetting.findMany({
      where: { organizationId, key: { in: [...REWARD_SETTING_KEYS] } },
      select: { key: true, value: true },
    });
    const values = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      emailVerificationRequired: asBoolean(values.get("REWARD_EMAIL_VERIFICATION_REQUIRED"), true),
      minActiveDays: asNonNegativeInteger(values.get("REWARD_MIN_ACTIVE_DAYS"), 7),
      realInteractionRequired: asBoolean(values.get("REWARD_REAL_INTERACTION_REQUIRED"), true),
    };
  }

  async checkUser(input: { organizationId: string; userId: string }): Promise<RewardEligibilityResult> {
    const [rules, user, validVotes, releaseLikes, trackLikes, comments, follows, meaningfulPlaybacks] = await Promise.all([
      this.getRules(input.organizationId),
      prisma.user.findUnique({ where: { id: input.userId }, select: { emailVerified: true, accountStatus: true, createdAt: true } }),
      prisma.vote.count({ where: { organizationId: input.organizationId, userId: input.userId, status: "VALID" } }),
      prisma.releaseLike.count({ where: { organizationId: input.organizationId, userId: input.userId } }),
      prisma.trackLike.count({ where: { organizationId: input.organizationId, userId: input.userId } }),
      prisma.comment.count({ where: { organizationId: input.organizationId, authorUserId: input.userId, status: "VISIBLE" } }),
      prisma.follow.count({ where: { organizationId: input.organizationId, userId: input.userId } }),
      prisma.playbackSession.count({
        where: {
          organizationId: input.organizationId,
          userId: input.userId,
          OR: [{ completed: true }, { listenedMilliseconds: { gte: 30_000 } }],
        },
      }),
    ]);

    const emailVerified = Boolean(user?.emailVerified);
    const activeSince = new Date(Date.now() - rules.minActiveDays * 86_400_000);
    const activeDaysPassed = Boolean(user && user.accountStatus === "ACTIVE" && user.createdAt <= activeSince);
    const interactionCount = validVotes + releaseLikes + trackLikes + comments + follows + meaningfulPlaybacks;
    const hasRealInteraction = interactionCount > 0;
    const checks: RewardEligibilityCheck[] = [
      {
        key: "emailVerification",
        label: "E-posta doğrulaması",
        passed: !rules.emailVerificationRequired || emailVerified,
        detail: rules.emailVerificationRequired ? (emailVerified ? "E-posta doğrulandı." : "E-posta henüz doğrulanmadı.") : "Bu koşul yönetici tarafından kapatıldı.",
      },
      {
        key: "activeDays",
        label: "Aktiflik süresi",
        passed: activeDaysPassed,
        detail: activeDaysPassed ? `${rules.minActiveDays} günlük aktiflik koşulu sağlandı.` : `Hesap en az ${rules.minActiveDays} gün aktif olmalı.`,
      },
      {
        key: "realInteraction",
        label: "Gerçek etkileşim",
        passed: !rules.realInteractionRequired || hasRealInteraction,
        detail: rules.realInteractionRequired ? (hasRealInteraction ? "Gerçek kullanıcı etkileşimi bulundu." : "Henüz geçerli bir etkileşim bulunamadı.") : "Bu koşul yönetici tarafından kapatıldı.",
      },
    ];

    return { eligible: Boolean(user) && checks.every((check) => check.passed), userId: input.userId, rules, checks };
  }
}

export const rewardEligibilityService = new RewardEligibilityService();
