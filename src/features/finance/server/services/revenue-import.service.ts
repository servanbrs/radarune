import "server-only";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { artistRepository } from "@/features/artist/server/repositories/artist.repository";
import { rbacService } from "@/features/authorization/server/rbac";
import { labelRepository } from "@/features/label/server/repositories/label.repository";
import { createTrackKey } from "@/features/finance/lib/track-key";
import {
  type RevenueImportCsvRowInput,
  revenueImportCsvRowSchema,
} from "@/features/finance/schemas/finance.schema";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { revenueImportRepository } from "@/features/finance/server/repositories/revenue-import.repository";
import { prisma } from "@/server/prisma/prisma";

type RevenueImportActor = {
  membershipRole: "OWNER" | "ADMIN" | "MEMBER";
  organizationId: string;
  systemRole: "USER" | "ARTIST" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  userId: string;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export class RevenueImportService {
  async importCsv(params: {
    actor: RevenueImportActor;
    fileName: string;
    mimeType: string;
    periodEnd: Date;
    periodStart: Date;
    reportingCurrency: "TRY" | "USD" | "EUR";
    text: string;
  }) {
    rbacService.assertEffectivePermission({
      membershipRole: params.actor.membershipRole,
      permission: "revenue-import:create",
      systemRole: params.actor.systemRole,
    });

    const sourceFileSha256 = sha256(params.text);
    const duplicateImport = await revenueImportRepository.findDuplicateImport(
      params.actor.organizationId,
      sourceFileSha256,
    );

    if (duplicateImport) {
      return {
        success: false as const,
        message: "Aynı dosya daha önce içe aktarılmış.",
      };
    }

    const parsedRows = parse(params.text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as unknown[];

    const validatedRows = parsedRows.map((row, index) => {
      const result = revenueImportCsvRowSchema.safeParse(row);

      return {
        index,
        result,
      };
    });

    const invalidRows = validatedRows.filter((row) => !row.result.success);
    const importRecord = await revenueImportRepository.createImport({
      organizationId: params.actor.organizationId,
      importedByUserId: params.actor.userId,
      fileName: params.fileName,
      sourceMimeType: params.mimeType,
      sourceFileSha256,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      reportingCurrency: params.reportingCurrency,
      rowCount: parsedRows.length,
    });

    if (invalidRows.length > 0) {
      await revenueImportRepository.failImport({
        importId: importRecord.id,
        failureReason: `CSV doğrulaması başarısız. Hatalı satır sayısı: ${invalidRows.length}`,
      });

      return {
        success: false as const,
        message: `CSV doğrulaması başarısız. Hatalı satır sayısı: ${invalidRows.length}`,
      };
    }

    const rows = validatedRows
      .filter(
        (
          row,
        ): row is {
          index: number;
          result: {
            data: RevenueImportCsvRowInput;
            success: true;
          };
        } => row.result.success,
      )
      .map((row) => row.result.data);
    const fileTransactionIds = new Set<string>();

    for (const row of rows) {
      if (fileTransactionIds.has(row.sourceTransactionId)) {
        await revenueImportRepository.failImport({
          importId: importRecord.id,
          failureReason: `Aynı CSV içinde mükerrer transaction bulundu: ${row.sourceTransactionId}`,
        });

        return {
          success: false as const,
          message: `Aynı CSV içinde mükerrer transaction bulundu: ${row.sourceTransactionId}`,
        };
      }

      fileTransactionIds.add(row.sourceTransactionId);
    }

    const labelSlugs = Array.from(new Set(rows.map((row) => row.labelSlug)));
    const artistSlugs = Array.from(new Set(rows.map((row) => row.artistSlug)));
    const [labels, artists] = await Promise.all([
      labelRepository.findByOrganizationAndSlugs(params.actor.organizationId, labelSlugs),
      artistRepository.findByOrganizationAndSlugs(params.actor.organizationId, artistSlugs),
    ]);

    const labelMap = new Map(labels.map((label) => [label.slug, label]));
    const artistMap = new Map(artists.map((artist) => [artist.slug, artist]));
    const unresolvedRows = rows.filter(
      (row) => !labelMap.has(row.labelSlug) || !artistMap.has(row.artistSlug),
    );

    if (unresolvedRows.length > 0) {
      await revenueImportRepository.failImport({
        importId: importRecord.id,
        failureReason: "Bazı satırlarda label veya artist eşleşmesi bulunamadı.",
      });

      return {
        success: false as const,
        message: "Bazı satırlarda label veya artist eşleşmesi bulunamadı.",
      };
    }

    const storeRevenueRows = rows.map((row) => {
      const label = labelMap.get(row.labelSlug);
      const artist = artistMap.get(row.artistSlug);
      const dedupeKey = sha256(
        [
          params.actor.organizationId,
          row.sourceTransactionId,
          row.reportDate.toISOString(),
          row.platformName,
          row.storeName,
        ].join("::"),
      );

      return {
        revenueImportId: importRecord.id,
        organizationId: params.actor.organizationId,
        reportDate: row.reportDate,
        storeName: row.storeName,
        platformName: row.platformName,
        countryCode: row.countryCode,
        currencyCode: row.currencyCode,
        exchangeRate: row.exchangeRate,
        releaseTitle: row.releaseTitle,
        trackTitle: row.trackTitle,
        trackKey: createTrackKey({
          releaseTitle: row.releaseTitle,
          trackTitle: row.trackTitle,
          ...(row.isrc ? { isrc: row.isrc } : {}),
        }),
        streamCount: row.streamCount,
        downloadCount: row.downloadCount,
        playlistAppearances: row.playlistAppearances,
        grossRevenueMinor: row.grossRevenueMinor,
        platformFeeMinor: row.platformFeeMinor,
        netRevenueMinor: row.netRevenueMinor,
        externalTransactionId: row.sourceTransactionId,
        dedupeKey,
        ...(label?.id ? { labelId: label.id } : {}),
        ...(artist?.id ? { artistId: artist.id } : {}),
        ...(row.isrc ? { isrc: row.isrc } : {}),
        ...(row.upc ? { upc: row.upc } : {}),
      };
    });

    const duplicateTransactions = await revenueImportRepository.findDuplicateTransactions(
      storeRevenueRows.map((row) => row.dedupeKey),
    );

    if (duplicateTransactions.length > 0) {
      await revenueImportRepository.failImport({
        importId: importRecord.id,
        failureReason: "Mükerrer transaction tespit edildi.",
      });

      return {
        success: false as const,
        message: "Mükerrer transaction tespit edildi.",
      };
    }

    const platformAggregateMap = new Map<
      string,
      {
        revenueImportId: string;
        organizationId: string;
        reportDate: Date;
        platformName: string;
        storeName: string;
        currencyCode: "TRY" | "USD" | "EUR";
        totalStreams: number;
        totalDownloads: number;
        grossRevenueMinor: bigint;
        netRevenueMinor: bigint;
      }
    >();

    for (const row of storeRevenueRows) {
      const key = [
        row.reportDate.toISOString(),
        row.platformName,
        row.storeName,
        row.currencyCode,
      ].join("::");

      const current = platformAggregateMap.get(key);

      if (!current) {
        platformAggregateMap.set(key, {
          revenueImportId: row.revenueImportId,
          organizationId: row.organizationId,
          reportDate: row.reportDate,
          platformName: row.platformName,
          storeName: row.storeName,
          currencyCode: row.currencyCode,
          totalStreams: row.streamCount,
          totalDownloads: row.downloadCount,
          grossRevenueMinor: row.grossRevenueMinor,
          netRevenueMinor: row.netRevenueMinor,
        });
        continue;
      }

      current.totalStreams += row.streamCount;
      current.totalDownloads += row.downloadCount;
      current.grossRevenueMinor += row.grossRevenueMinor;
      current.netRevenueMinor += row.netRevenueMinor;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await revenueImportRepository.createStoreRevenues(storeRevenueRows, tx);
        await revenueImportRepository.createPlatformRevenues(
          Array.from(platformAggregateMap.values()),
          tx,
        );
        await revenueImportRepository.completeImport(
          {
            importId: importRecord.id,
            importedRowCount: storeRevenueRows.length,
            rejectedRowCount: 0,
          },
          tx,
        );

        await auditLogService.create(
          {
            organizationId: params.actor.organizationId,
            actorUserId: params.actor.userId,
            action: "REVENUE_IMPORT",
            entityType: "RevenueImport",
            entityId: importRecord.id,
            metadata: {
              fileName: params.fileName,
              rowCount: storeRevenueRows.length,
              reportingCurrency: params.reportingCurrency,
            },
          },
          tx,
        );
      });

      return {
        success: true as const,
        data: {
          importId: importRecord.id,
          importedRowCount: storeRevenueRows.length,
        },
      };
    } catch (error) {
      await revenueImportRepository.failImport({
        importId: importRecord.id,
        failureReason:
          error instanceof Error ? error.message : "Revenue import başarısız oldu.",
      });

      return {
        success: false as const,
        message:
          error instanceof Error ? error.message : "Revenue import başarısız oldu.",
      };
    }
  }

  async listImportsByOrganization(actor: RevenueImportActor) {
    rbacService.assertEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "revenue-import:view",
      systemRole: actor.systemRole,
    });

    return revenueImportRepository.listImportsByOrganization(actor.organizationId);
  }
}

export const revenueImportService = new RevenueImportService();
