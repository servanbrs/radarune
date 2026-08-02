import "server-only";
import { rbacService } from "@/features/authorization/server/rbac";
import { financialStatementRepository } from "@/features/finance/server/repositories/financial-statement.repository";
import {
  financeAccessService,
  type FinanceActorContext,
} from "@/features/finance/server/services/finance-access.service";

function assertStatementAccess(actor: FinanceActorContext) {
  const hasPermission =
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "statements:view:own",
      systemRole: actor.systemRole,
    }) ||
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "statements:view:label",
      systemRole: actor.systemRole,
    }) ||
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "statements:view:all",
      systemRole: actor.systemRole,
    });

  if (!hasPermission) {
    throw new Error("Finansal statement görüntüleme yetkiniz yok.");
  }
}

function canAccessStatement(
  actor: FinanceActorContext,
  statement: {
    artistId: string | null;
    beneficiaryUserId: string | null;
  },
  accessibleArtistIds: string[] | null,
) {
  if (financeAccessService.canViewLabelFinance(actor) || accessibleArtistIds === null) {
    return true;
  }

  if (statement.beneficiaryUserId === actor.userId) {
    return true;
  }

  return statement.artistId ? accessibleArtistIds.includes(statement.artistId) : false;
}

export class FinancialStatementService {
  async listStatements(actor: FinanceActorContext) {
    assertStatementAccess(actor);

    const [statements, accessibleArtistIds] = await Promise.all([
      financialStatementRepository.listStatementsByOrganization(actor.organizationId),
      financeAccessService.listAccessibleArtistIds(actor),
    ]);

    return statements.filter((statement) =>
      canAccessStatement(actor, statement, accessibleArtistIds),
    );
  }

  async getStatementDetail(actor: FinanceActorContext, statementId: string) {
    assertStatementAccess(actor);

    const [statement, accessibleArtistIds] = await Promise.all([
      financialStatementRepository.getStatementById(statementId, actor.organizationId),
      financeAccessService.listAccessibleArtistIds(actor),
    ]);

    if (!statement) {
      return null;
    }

    if (!canAccessStatement(actor, statement, accessibleArtistIds)) {
      throw new Error("Bu statement kaydına erişim yetkiniz yok.");
    }

    return statement;
  }
}

export const financialStatementService = new FinancialStatementService();
