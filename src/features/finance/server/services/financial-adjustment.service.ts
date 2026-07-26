import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { financialAdjustmentSchema, type FinancialAdjustmentInput } from "@/features/finance/schemas/finance.schema";
import { rbacService } from "@/features/authorization/server/rbac";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export class FinancialAdjustmentService {
  async createAdjustment(actor: FinanceActorContext, rawInput: FinancialAdjustmentInput) {
    rbacService.assertEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "financial-settings:update",
      systemRole: actor.systemRole,
    });

    const input = financialAdjustmentSchema.parse(rawInput);
    const statement = await financialStatementService.getStatementDetail(actor, input.statementId);

    if (!statement) {
      return {
        success: false as const,
        message: "Statement bulunamadı.",
      };
    }

    if (statement.currencyCode !== input.currencyCode) {
      return {
        success: false as const,
        message: "Adjustment currency statement currency ile aynı olmalıdır.",
      };
    }

    const adjustment = await prisma.$transaction(async (tx) => {
      const created = await tx.financialAdjustment.create({
        data: {
          organizationId: actor.organizationId,
          createdByUserId: actor.userId,
          subjectType: statement.subjectType,
          beneficiaryUserId: statement.beneficiaryUserId,
          artistId: statement.artistId,
          labelId: statement.labelId,
          statementId: statement.id,
          direction: input.direction,
          currencyCode: input.currencyCode,
          amountMinor: input.amountMinor,
          reason: input.reason,
        },
        select: {
          id: true,
        },
      });

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "ADJUSTMENT",
          entityType: "FinancialAdjustment",
          entityId: created.id,
          metadata: {
            statementId: statement.id,
            amountMinor: input.amountMinor.toString(),
            direction: input.direction,
          },
        },
        tx,
      );

      return created;
    });

    return {
      success: true as const,
      data: adjustment,
    };
  }
}

export const financialAdjustmentService = new FinancialAdjustmentService();
