import "server-only";
import { applyBasisPoints, applyRateToMinorUnits, sumBigInt } from "@/features/finance/lib/money";
import { rbacService } from "@/features/authorization/server/rbac";
import {
  type GenerateRoyaltyReportInput,
  royaltySplitInputSchema,
  type RoyaltySplitInput,
} from "@/features/finance/schemas/finance.schema";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { financeAccessService } from "@/features/finance/server/services/finance-access.service";
import { exchangeRateRepository } from "@/features/finance/server/repositories/exchange-rate.repository";
import { financialStatementRepository } from "@/features/finance/server/repositories/financial-statement.repository";
import { payoutRepository } from "@/features/finance/server/repositories/payout.repository";
import { revenueImportRepository } from "@/features/finance/server/repositories/revenue-import.repository";
import { royaltyRepository } from "@/features/finance/server/repositories/royalty.repository";
import { prisma } from "@/server/prisma/prisma";

type RoyaltyActor = {
  membershipRole: "OWNER" | "ADMIN" | "MEMBER";
  organizationId: string;
  systemRole: "USER" | "ARTIST" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  userId: string;
};

function assertSplitTotals(splits: RoyaltySplitInput[]) {
  const total = splits.reduce((sum, split) => sum + split.percentageBps, 0);

  if (total !== 10000) {
    throw new Error("Royalty split toplamı tam olarak %100 olmalıdır.");
  }
}

function allocateByBasisPoints(
  distributableMinor: bigint,
  splits: Array<{
    percentageBps: number;
  }>,
) {
  let allocated = 0n;

  return splits.map((split, index) => {
    if (index === splits.length - 1) {
      return distributableMinor - allocated;
    }

    const amount = applyBasisPoints(distributableMinor, split.percentageBps);
    allocated += amount;
    return amount;
  });
}

export class RoyaltyEngineService {
  async createTrackSplits(actor: RoyaltyActor, input: {
    releaseTitle?: string;
    splits: RoyaltySplitInput[];
    trackKey: string;
    trackTitle: string;
  }) {
    rbacService.assertEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:generate",
      systemRole: actor.systemRole,
    });

    const parsedSplits = input.splits.map((split) => royaltySplitInputSchema.parse(split));
    assertSplitTotals(parsedSplits);

    const beneficiaryUserIds = Array.from(
      new Set(
        parsedSplits
          .map((split) => split.beneficiaryUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const artistIds = Array.from(
      new Set(
        parsedSplits
          .map((split) => split.artistId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const labelIds = Array.from(
      new Set(
        parsedSplits
          .map((split) => split.labelId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const [memberships, artists, labels] = await Promise.all([
      beneficiaryUserIds.length
        ? prisma.organizationMembership.findMany({
            where: {
              organizationId: actor.organizationId,
              userId: { in: beneficiaryUserIds },
              status: "ACTIVE",
            },
            select: { userId: true },
          })
        : [],
      artistIds.length
        ? prisma.artist.findMany({
            where: { organizationId: actor.organizationId, id: { in: artistIds } },
            select: { id: true },
          })
        : [],
      labelIds.length
        ? prisma.label.findMany({
            where: { organizationId: actor.organizationId, id: { in: labelIds } },
            select: { id: true },
          })
        : [],
    ]);

    if (memberships.length !== beneficiaryUserIds.length) {
      throw new Error("Royalty beneficiary kullanıcısı bu organizasyona ait değil.");
    }
    if (artists.length !== artistIds.length) {
      throw new Error("Royalty artist kaydı bu organizasyona ait değil.");
    }
    if (labels.length !== labelIds.length) {
      throw new Error("Royalty label kaydı bu organizasyona ait değil.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.royaltySplit.deleteMany({
        where: {
          organizationId: actor.organizationId,
          trackKey: input.trackKey,
        },
      });

      for (const split of parsedSplits) {
        await royaltyRepository.createSplit(
          {
            organizationId: actor.organizationId,
            trackKey: input.trackKey,
            trackTitle: input.trackTitle,
            role: split.role,
            participantName: split.participantName,
            percentageBps: split.percentageBps,
            ...(split.beneficiaryUserId
              ? { beneficiaryUserId: split.beneficiaryUserId }
              : {}),
            ...(split.artistId ? { artistId: split.artistId } : {}),
            ...(split.labelId ? { labelId: split.labelId } : {}),
            ...(input.releaseTitle ? { releaseTitle: input.releaseTitle } : {}),
          },
          tx,
        );
      }

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "ROYALTY_SPLIT_UPSERT",
          entityType: "RoyaltySplit",
          entityId: input.trackKey,
          metadata: {
            splitCount: parsedSplits.length,
            trackTitle: input.trackTitle,
          },
        },
        tx,
      );
    });

    return {
      success: true as const,
    };
  }

  async generateRoyaltyReport(actor: RoyaltyActor, input: GenerateRoyaltyReportInput) {
    rbacService.assertEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:generate",
      systemRole: actor.systemRole,
    });

    if (input.periodEnd < input.periodStart) {
      return {
        success: false as const,
        message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
      };
    }

    const [hasImports, existingReport, revenueRows] = await Promise.all([
      revenueImportRepository.hasCompletedImportsForPeriod({
        organizationId: actor.organizationId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      }),
      royaltyRepository.findExistingReport({
        organizationId: actor.organizationId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        reportingCurrency: input.reportingCurrency,
      }),
      revenueImportRepository.listStoreRevenueRowsForPeriod({
        organizationId: actor.organizationId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      }),
    ]);

    if (!hasImports || revenueRows.length === 0) {
      return {
        success: false as const,
        message: "Revenue import olmadan royalty hesaplanamaz.",
      };
    }

    if (existingReport) {
      return {
        success: false as const,
        message: "Bu dönem ve para birimi için immutable bir royalty raporu zaten mevcut.",
      };
    }

    const splitMap = new Map<string, Awaited<ReturnType<typeof royaltyRepository.listSplitsByTrackKeys>>[number][]>();
    const splits = await royaltyRepository.listSplitsByTrackKeys(
      actor.organizationId,
      Array.from(new Set(revenueRows.map((row) => row.trackKey))),
    );

    for (const split of splits) {
      const current = splitMap.get(split.trackKey) ?? [];
      current.push(split);
      splitMap.set(split.trackKey, current);
    }

    for (const splitEntries of splitMap.values()) {
      const total = splitEntries.reduce((sum, split) => sum + split.percentageBps, 0);

      if (total !== 10000) {
        return {
          success: false as const,
          message: "Royalty split toplamı tam olarak %100 olmalıdır.",
        };
      }
    }

    const lineDrafts: Array<{
      organizationId: string;
      subjectType: "ARTIST" | "LABEL";
      beneficiaryUserId?: string;
      artistId?: string;
      labelId?: string;
      sourceStoreRevenueId: string;
      participantName: string;
      splitRole: "LABEL" | "ARTIST" | "PRODUCER" | "COMPOSER" | "LYRICIST" | "MANAGER";
      platformName: string;
      storeName: string;
      countryCode: string;
      currencyCode: "TRY" | "USD" | "EUR";
      trackKey: string;
      trackTitle: string;
      releaseTitle: string;
      grossRevenueMinor: bigint;
      platformFeeMinor: bigint;
      commissionMinor: bigint;
      distributableMinor: bigint;
      beneficiaryAmountMinor: bigint;
      shareBps: number;
    }> = [];

    for (const row of revenueRows) {
      const rate =
        row.currencyCode === input.reportingCurrency
          ? null
          : row.revenueImport.reportingCurrency === input.reportingCurrency
            ? row.exchangeRate.toString()
            : (
                await exchangeRateRepository.findLatestRate({
                  organizationId: actor.organizationId,
                  effectiveDate: row.reportDate,
                  baseCurrency: row.currencyCode,
                  quoteCurrency: input.reportingCurrency,
                })
              )?.rate.toString();

      if (row.currencyCode !== input.reportingCurrency && !rate) {
        return {
          success: false as const,
          message: `${row.currencyCode} -> ${input.reportingCurrency} için kur bulunamadı.`,
        };
      }

      const grossRevenueMinor =
        row.currencyCode === input.reportingCurrency
          ? row.grossRevenueMinor
          : applyRateToMinorUnits(row.grossRevenueMinor, rate!);
      const platformFeeMinor =
        row.currencyCode === input.reportingCurrency
          ? row.platformFeeMinor
          : applyRateToMinorUnits(row.platformFeeMinor, rate!);
      const netRevenueMinor =
        row.currencyCode === input.reportingCurrency
          ? row.netRevenueMinor
          : applyRateToMinorUnits(row.netRevenueMinor, rate!);
      const commissionMinor = applyBasisPoints(
        netRevenueMinor,
        input.radaruneCommissionBps,
      );
      const distributableMinor = netRevenueMinor - commissionMinor;

      const rowSplits = splitMap.get(row.trackKey) ?? [];
      const effectiveSplits =
        rowSplits.length > 0
          ? rowSplits
          : row.label
            ? [
                {
                  beneficiaryUserId: null,
                  artistId: null,
                  labelId: row.label.id,
                  participantName: row.label.name,
                  percentageBps: 10000,
                  role: "LABEL" as const,
                },
              ]
            : row.artist
              ? [
                  {
                    beneficiaryUserId: row.artist.ownerUserId,
                    artistId: row.artist.id,
                    labelId: null,
                    participantName: row.artist.name,
                    percentageBps: 10000,
                    role: "ARTIST" as const,
                  },
                ]
              : null;

      if (!effectiveSplits) {
        return {
          success: false as const,
          message: `${row.trackTitle} için beneficiary bulunamadı.`,
        };
      }

      const allocations = allocateByBasisPoints(distributableMinor, effectiveSplits);

      effectiveSplits.forEach((split, index) => {
        const beneficiaryAmountMinor = allocations[index];

        if (beneficiaryAmountMinor === undefined) {
          throw new Error("Royalty allocation hesaplaması tamamlanamadı.");
        }

        const subjectType =
          split.labelId || split.role === "LABEL" ? "LABEL" : "ARTIST";

        lineDrafts.push({
          organizationId: actor.organizationId,
          subjectType,
          sourceStoreRevenueId: row.id,
          participantName: split.participantName,
          splitRole: split.role,
          platformName: row.platformName,
          storeName: row.storeName,
          countryCode: row.countryCode,
          currencyCode: input.reportingCurrency,
          trackKey: row.trackKey,
          trackTitle: row.trackTitle,
          releaseTitle: row.releaseTitle,
          grossRevenueMinor,
          platformFeeMinor,
          commissionMinor,
          distributableMinor,
          beneficiaryAmountMinor,
          shareBps: split.percentageBps,
          ...(split.beneficiaryUserId
            ? { beneficiaryUserId: split.beneficiaryUserId }
            : {}),
          ...(split.artistId ? { artistId: split.artistId } : {}),
          ...(split.labelId ? { labelId: split.labelId } : {}),
        });
      });
    }

    const summary = {
      totalStreams: revenueRows.reduce((sum, row) => sum + row.streamCount, 0),
      totalDownloads: revenueRows.reduce((sum, row) => sum + row.downloadCount, 0),
      grossRevenueMinor: sumBigInt(lineDrafts.map((line) => line.grossRevenueMinor)),
      platformFeeMinor: sumBigInt(lineDrafts.map((line) => line.platformFeeMinor)),
      commissionMinor: sumBigInt(lineDrafts.map((line) => line.commissionMinor)),
      netRevenueMinor: sumBigInt(lineDrafts.map((line) => line.distributableMinor)),
    };

    try {
      const report = await prisma.$transaction(async (tx) => {
        await royaltyRepository.createRevenueReport(
          {
            organizationId: actor.organizationId,
            generatedByUserId: actor.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            reportingCurrency: input.reportingCurrency,
            totalStreams: summary.totalStreams,
            totalDownloads: summary.totalDownloads,
            grossRevenueMinor: summary.grossRevenueMinor,
            platformFeeMinor: summary.platformFeeMinor,
            netRevenueMinor: summary.netRevenueMinor,
          },
          tx,
        );

        const royaltyReport = await royaltyRepository.createRoyaltyReport(
          {
            organizationId: actor.organizationId,
            generatedByUserId: actor.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            reportingCurrency: input.reportingCurrency,
            grossRevenueMinor: summary.grossRevenueMinor,
            platformFeeMinor: summary.platformFeeMinor,
            commissionMinor: summary.commissionMinor,
            netRevenueMinor: summary.netRevenueMinor,
          },
          tx,
        );

        await royaltyRepository.createRoyaltyLines(
          lineDrafts.map((line) => ({
            ...line,
            royaltyReportId: royaltyReport.id,
          })),
          tx,
        );

        const statementMap = new Map<string, {
          subjectType: "ARTIST" | "LABEL";
          beneficiaryUserId?: string;
          artistId?: string;
          labelId?: string;
          totalRevenueMinor: bigint;
        }>();

        for (const line of lineDrafts) {
          const key = [
            line.subjectType,
            line.beneficiaryUserId ?? "",
            line.artistId ?? "",
            line.labelId ?? "",
          ].join("::");
          const current = statementMap.get(key);

          if (!current) {
            statementMap.set(key, {
              subjectType: line.subjectType,
              totalRevenueMinor: line.beneficiaryAmountMinor,
              ...(line.beneficiaryUserId
                ? { beneficiaryUserId: line.beneficiaryUserId }
                : {}),
              ...(line.artistId ? { artistId: line.artistId } : {}),
              ...(line.labelId ? { labelId: line.labelId } : {}),
            });
            continue;
          }

          current.totalRevenueMinor += line.beneficiaryAmountMinor;
        }

        const statements = [];

        for (const statement of statementMap.values()) {
          const [previousStatement, adjustmentsMinor, withdrawalsMinor] =
            await Promise.all([
              financialStatementRepository.findLatestStatementBeforePeriod({
                organizationId: actor.organizationId,
                subjectType: statement.subjectType,
                periodStart: input.periodStart,
                ...(statement.beneficiaryUserId
                  ? { beneficiaryUserId: statement.beneficiaryUserId }
                  : {}),
                ...(statement.artistId ? { artistId: statement.artistId } : {}),
                ...(statement.labelId ? { labelId: statement.labelId } : {}),
              }),
              financialStatementRepository.sumAdjustmentsForSubjectInPeriod({
                organizationId: actor.organizationId,
                subjectType: statement.subjectType,
                periodStart: input.periodStart,
                periodEnd: input.periodEnd,
                ...(statement.beneficiaryUserId
                  ? { beneficiaryUserId: statement.beneficiaryUserId }
                  : {}),
                ...(statement.artistId ? { artistId: statement.artistId } : {}),
                ...(statement.labelId ? { labelId: statement.labelId } : {}),
              }),
              payoutRepository.sumPaidWithdrawalsForSubjectInPeriod({
                organizationId: actor.organizationId,
                subjectType: statement.subjectType,
                periodStart: input.periodStart,
                periodEnd: input.periodEnd,
                ...(statement.beneficiaryUserId
                  ? { beneficiaryUserId: statement.beneficiaryUserId }
                  : {}),
                ...(statement.artistId ? { artistId: statement.artistId } : {}),
                ...(statement.labelId ? { labelId: statement.labelId } : {}),
              }),
            ]);

          const openingBalanceMinor = previousStatement?.closingBalanceMinor ?? 0n;
          const closingBalanceMinor =
            openingBalanceMinor +
            statement.totalRevenueMinor +
            adjustmentsMinor -
            withdrawalsMinor;

          statements.push({
            organizationId: actor.organizationId,
            royaltyReportId: royaltyReport.id,
            subjectType: statement.subjectType,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            currencyCode: input.reportingCurrency,
            openingBalanceMinor,
            totalRevenueMinor: statement.totalRevenueMinor,
            adjustmentsMinor,
            withdrawalsMinor,
            closingBalanceMinor,
            ...(statement.beneficiaryUserId
              ? { beneficiaryUserId: statement.beneficiaryUserId }
              : {}),
            ...(statement.artistId ? { artistId: statement.artistId } : {}),
            ...(statement.labelId ? { labelId: statement.labelId } : {}),
          });
        }

        await financialStatementRepository.createManyStatements(statements, tx);

        await auditLogService.create(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.userId,
            action: "ROYALTY_GENERATE",
            entityType: "RoyaltyReport",
            entityId: royaltyReport.id,
            metadata: {
              periodStart: input.periodStart.toISOString(),
              periodEnd: input.periodEnd.toISOString(),
              reportingCurrency: input.reportingCurrency,
            },
          },
          tx,
        );

        return royaltyReport;
      });

      return {
        success: true as const,
        data: {
          royaltyReportId: report.id,
        },
      };
    } catch (error) {
      return {
        success: false as const,
        message:
          error instanceof Error ? error.message : "Royalty raporu oluşturulamadı.",
      };
    }
  }

  async listReports(actor: RoyaltyActor) {
    const hasOwnAccess = rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:view:own",
      systemRole: actor.systemRole,
    });
    const hasLabelAccess = rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:view:label",
      systemRole: actor.systemRole,
    });
    const hasAllAccess = rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:view:all",
      systemRole: actor.systemRole,
    });

    if (!hasOwnAccess && !hasLabelAccess && !hasAllAccess) {
      throw new Error("Royalty raporlarını görüntüleme yetkiniz yok.");
    }

    if (financeAccessService.canViewLabelFinance(actor)) {
      return royaltyRepository.listReportsByOrganization(actor.organizationId);
    }

    const accessibleArtistIds = await financeAccessService.listAccessibleArtistIds(actor);
    const reports = await royaltyRepository.listReportsByOrganization(actor.organizationId);

    if (accessibleArtistIds === null) {
      return reports;
    }

    const filteredReports = [];

    for (const report of reports) {
      const detail = await royaltyRepository.getReportWithLines(report.id);

      if (
        detail?.lines.some(
          (line) =>
            line.beneficiaryUserId === actor.userId ||
            (line.artistId ? accessibleArtistIds.includes(line.artistId) : false),
        )
      ) {
        filteredReports.push(report);
      }
    }

    return filteredReports;
  }

  async getReportDetail(actor: RoyaltyActor, reportId: string) {
    const hasOwnAccess = rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:view:own",
      systemRole: actor.systemRole,
    });
    const hasLabelAccess = rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:view:label",
      systemRole: actor.systemRole,
    });
    const hasAllAccess = rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "royalties:view:all",
      systemRole: actor.systemRole,
    });

    if (!hasOwnAccess && !hasLabelAccess && !hasAllAccess) {
      throw new Error("Royalty raporunu görüntüleme yetkiniz yok.");
    }

    const report = await royaltyRepository.getReportWithLines(reportId);

    if (!report) {
      return null;
    }

    if (financeAccessService.canViewLabelFinance(actor)) {
      return report;
    }

    const accessibleArtistIds = await financeAccessService.listAccessibleArtistIds(actor);

    if (accessibleArtistIds === null) {
      return report;
    }

    const filteredLines = report.lines.filter(
      (line) =>
        line.beneficiaryUserId === actor.userId ||
        (line.artistId ? accessibleArtistIds.includes(line.artistId) : false),
    );

    if (filteredLines.length === 0) {
      throw new Error("Bu royalty raporuna erişim yetkiniz yok.");
    }

    return {
      ...report,
      lines: filteredLines,
    };
  }
}

export const royaltyEngineService = new RoyaltyEngineService();
