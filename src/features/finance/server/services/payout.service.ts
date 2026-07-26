import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/prisma/prisma";
import { payoutDecisionSchema, payoutRequestSchema, type PayoutDecisionInput, type PayoutRequestInput } from "@/features/finance/schemas/finance.schema";
import { rbacService } from "@/features/authorization/server/rbac";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";
import {
  financeAccessService,
  type FinanceActorContext,
} from "@/features/finance/server/services/finance-access.service";
import { payoutRepository } from "@/features/finance/server/repositories/payout.repository";

function assertCanRequestPayout(actor: FinanceActorContext, subjectType: "ARTIST" | "LABEL") {
  const permission = subjectType === "LABEL" ? "payouts:request:label" : "payouts:request:own";

  rbacService.assertEffectivePermission({
    membershipRole: actor.membershipRole,
    permission,
    systemRole: actor.systemRole,
  });
}

function assertCanManagePayout(actor: FinanceActorContext, permission: "payouts:approve" | "payouts:cancel") {
  rbacService.assertEffectivePermission({
    membershipRole: actor.membershipRole,
    permission,
    systemRole: actor.systemRole,
  });
}

export class PayoutService {
  async listPayouts(actor: FinanceActorContext) {
    const [payouts, accessibleArtistIds] = await Promise.all([
      payoutRepository.listPayoutsByOrganization(actor.organizationId),
      financeAccessService.listAccessibleArtistIds(actor),
    ]);

    if (financeAccessService.canViewLabelFinance(actor) || accessibleArtistIds === null) {
      return payouts;
    }

    return payouts.filter((payout) => {
      if (payout.beneficiaryUser?.id === actor.userId) {
        return true;
      }

      return payout.artist?.id ? accessibleArtistIds.includes(payout.artist.id) : false;
    });
  }

  async requestPayout(actor: FinanceActorContext, rawInput: PayoutRequestInput) {
    const input = payoutRequestSchema.parse(rawInput);
    const statement = await financialStatementService.getStatementDetail(actor, input.statementId);

    if (!statement) {
      return {
        success: false as const,
        message: "Statement bulunamadı.",
      };
    }

    assertCanRequestPayout(actor, statement.subjectType);

    if (statement.currencyCode !== input.currencyCode) {
      return {
        success: false as const,
        message: "Payout para birimi statement para birimi ile aynı olmalıdır.",
      };
    }

    if (input.amountMinor > statement.closingBalanceMinor) {
      return {
        success: false as const,
        message: "Talep edilen payout tutarı kullanılabilir bakiyeden büyük olamaz.",
      };
    }

    const payoutMethod = await payoutRepository.findMethodById(input.payoutMethodId);

    if (
      !payoutMethod ||
      payoutMethod.organizationId !== actor.organizationId ||
      !payoutMethod.isActive
    ) {
      return {
        success: false as const,
        message: "Geçerli bir payout yöntemi bulunamadı.",
      };
    }

    if (
      statement.subjectType === "ARTIST" &&
      statement.artistId &&
      payoutMethod.artistId !== statement.artistId
    ) {
      return {
        success: false as const,
        message: "Payout yöntemi artist statement ile eşleşmiyor.",
      };
    }

    if (
      statement.subjectType === "LABEL" &&
      statement.labelId &&
      payoutMethod.labelId !== statement.labelId
    ) {
      return {
        success: false as const,
        message: "Payout yöntemi label statement ile eşleşmiyor.",
      };
    }

    try {
      const payout = await prisma.$transaction(async (tx) => {
        const duplicate = await payoutRepository.findDuplicateOpenPayout(input.statementId, tx);

        if (duplicate) {
          throw new Error("Bu statement için zaten açık veya tamamlanmış bir payout kaydı var.");
        }

        const created = await payoutRepository.createPayout(
          {
            organizationId: actor.organizationId,
            requestedByUserId: actor.userId,
            statementId: statement.id,
            payoutMethodId: input.payoutMethodId,
            subjectType: statement.subjectType,
            amountMinor: input.amountMinor,
            currencyCode: input.currencyCode,
            idempotencyKey: randomUUID(),
            ...(statement.beneficiaryUserId
              ? { beneficiaryUserId: statement.beneficiaryUserId }
              : {}),
            ...(statement.artistId ? { artistId: statement.artistId } : {}),
            ...(statement.labelId ? { labelId: statement.labelId } : {}),
          },
          tx,
        );

        await auditLogService.create(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.userId,
            action: "PAYOUT_REQUEST",
            entityType: "Payout",
            entityId: created.id,
            metadata: {
              amountMinor: input.amountMinor.toString(),
              currencyCode: input.currencyCode,
              statementId: input.statementId,
            },
          },
          tx,
        );

        return created;
      });

      return {
        success: true as const,
        data: payout,
      };
    } catch (error) {
      return {
        success: false as const,
        message: error instanceof Error ? error.message : "Payout talebi oluşturulamadı.",
      };
    }
  }

  async approvePayout(actor: FinanceActorContext, payoutId: string) {
    assertCanManagePayout(actor, "payouts:approve");

    const payout = await payoutRepository.findPayoutById(payoutId);

    if (!payout || payout.organizationId !== actor.organizationId) {
      return {
        success: false as const,
        message: "Payout kaydı bulunamadı.",
      };
    }

    if (payout.status !== "PENDING") {
      return {
        success: false as const,
        message: "Sadece PENDING durumundaki payout kayıtları onaylanabilir.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await payoutRepository.approvePayout(payoutId, actor.userId, tx);

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "PAYOUT_APPROVE",
          entityType: "Payout",
          entityId: payoutId,
          metadata: {
            statementId: payout.statementId,
          },
        },
        tx,
      );
    });

    return {
      success: true as const,
    };
  }

  async cancelPayout(
    actor: FinanceActorContext,
    payoutId: string,
    rawInput: PayoutDecisionInput,
  ) {
    assertCanManagePayout(actor, "payouts:cancel");

    const input = payoutDecisionSchema.parse(rawInput);
    const payout = await payoutRepository.findPayoutById(payoutId);

    if (!payout || payout.organizationId !== actor.organizationId) {
      return {
        success: false as const,
        message: "Payout kaydı bulunamadı.",
      };
    }

    if (payout.status === "PAID" || payout.status === "CANCELLED") {
      return {
        success: false as const,
        message: "Bu payout kaydı iptal edilemez durumda.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await payoutRepository.cancelPayout(payoutId, input.reason, tx);

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "PAYOUT_CANCEL",
          entityType: "Payout",
          entityId: payoutId,
          metadata: {
            reason: input.reason,
          },
        },
        tx,
      );
    });

    return {
      success: true as const,
    };
  }
}

export const payoutService = new PayoutService();
