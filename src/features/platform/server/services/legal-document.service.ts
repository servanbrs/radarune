import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

function assertSafeContent(content: string) {
  if (/<\/?(script|iframe|object|embed|form)\b/i.test(content) || /\bon[a-z]+\s*=|javascript:/i.test(content)) throw new Error("Yasal metin zararlı HTML veya script içeremez.");
}

export class LegalDocumentService {
  async publish(actor: FinanceActorContext, input: { documentId?: string; type: Prisma.LegalDocumentCreateInput["type"]; slug: string; title: string; locale: string; required: boolean; content: string; changeSummary?: string }) {
    assertAdminPermission(actor, "legal:manage");
    assertSafeContent(input.content);
    return prisma.$transaction(async (tx) => {
      const document = input.documentId ? await tx.legalDocument.findFirst({ where: { id: input.documentId, organizationId: actor.organizationId } }) : null;
      const target = document ?? await tx.legalDocument.create({ data: { organizationId: actor.organizationId, type: input.type, slug: input.slug, title: input.title, locale: input.locale, required: input.required, status: "DRAFT" } });
      const latest = await tx.legalDocumentVersion.aggregate({ where: { documentId: target.id }, _max: { version: true } });
      const version = await tx.legalDocumentVersion.create({ data: { documentId: target.id, organizationId: actor.organizationId, version: (latest._max.version ?? 0) + 1, content: input.content, changeSummary: input.changeSummary ?? null, effectiveAt: new Date(), publishedAt: new Date() } });
      await tx.legalDocument.update({ where: { id: target.id }, data: { title: input.title, required: input.required, status: "PUBLISHED", publishedAt: new Date() } });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "LEGAL_DOCUMENT_PUBLISHED", entityType: "LegalDocumentVersion", entityId: version.id, metadata: { documentId: target.id, version: version.version } }, tx);
      return { documentId: target.id, versionId: version.id, version: version.version };
    });
  }

  async requiredPending(organizationId: string, userId: string) {
    const required = await prisma.legalDocument.findMany({ where: { organizationId, required: true, status: "PUBLISHED" }, include: { versions: { where: { publishedAt: { not: null } }, orderBy: { version: "desc" }, take: 1 } } });
    const accepted = await prisma.userConsent.findMany({ where: { organizationId, userId, accepted: true, revokedAt: null }, select: { documentId: true, versionId: true } });
    const acceptedVersions = new Set(accepted.map((item) => `${item.documentId}:${item.versionId}`));
    return required.filter((document) => document.versions[0] && !acceptedVersions.has(`${document.id}:${document.versions[0].id}`));
  }
}

export const legalDocumentService = new LegalDocumentService();
