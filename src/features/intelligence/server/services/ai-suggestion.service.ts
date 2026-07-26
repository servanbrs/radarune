import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import type { SuggestionDecisionInput } from "@/features/intelligence/schemas/intelligence.schema";

export class AiSuggestionService {
  async decide(actor: FinanceActorContext, input: SuggestionDecisionInput) {
    const suggestion = await prisma.metadataSuggestion.findUnique({
      where: { id: input.suggestionId },
      include: { analysis: { include: { release: true } } },
    });

    if (!suggestion || suggestion.organizationId !== actor.organizationId) {
      throw new Error("AI önerisi bulunamadı.");
    }

    if (suggestion.analysis.release.createdByUserId !== actor.userId && !["ADMIN", "SUPER_ADMIN"].includes(actor.systemRole)) {
      throw new Error("Bu öneriyi yönetme yetkiniz yok.");
    }

    const status = input.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";
    const updated = await prisma.metadataSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status,
        decidedAt: new Date(),
        ...(input.decision === "ACCEPT"
          ? { acceptedByUserId: actor.userId }
          : { rejectedByUserId: actor.userId }),
      },
      select: { id: true, status: true },
    });

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: input.decision === "ACCEPT" ? "AI_SUGGESTION_ACCEPTED" : "AI_SUGGESTION_REJECTED",
      entityType: "MetadataSuggestion",
      entityId: suggestion.id,
      metadata: {
        releaseId: suggestion.analysis.releaseId,
        fieldPath: suggestion.fieldPath,
      },
    });

    return updated;
  }
}

export const aiSuggestionService = new AiSuggestionService();
