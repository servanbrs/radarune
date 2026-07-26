import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const findDuplicateImport = vi.fn();
const createImport = vi.fn();
const failImport = vi.fn();

vi.mock("@/features/finance/server/repositories/revenue-import.repository", () => ({
  revenueImportRepository: {
    findDuplicateImport,
    createImport,
    failImport,
    findDuplicateTransactions: vi.fn(),
    createStoreRevenues: vi.fn(),
    createPlatformRevenues: vi.fn(),
    completeImport: vi.fn(),
    listImportsByOrganization: vi.fn(),
  },
}));
vi.mock("@/features/artist/server/repositories/artist.repository", () => ({
  artistRepository: {
    findByOrganizationAndSlugs: vi.fn(),
  },
}));
vi.mock("@/features/label/server/repositories/label.repository", () => ({
  labelRepository: {
    findByOrganizationAndSlugs: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/services/audit-log.service", () => ({
  auditLogService: {
    create: vi.fn(),
  },
}));
vi.mock("@/server/prisma/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe("revenueImportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aynı dosya daha önce import edildiyse reddeder", async () => {
    findDuplicateImport.mockResolvedValue({
      id: "import_existing",
    });

    const { revenueImportService } = await import(
      "@/features/finance/server/services/revenue-import.service"
    );

    const result = await revenueImportService.importCsv({
      actor: {
        organizationId: "org_1",
        membershipRole: "OWNER",
        systemRole: "ADMIN",
        userId: "user_1",
      },
      fileName: "revenue.csv",
      mimeType: "text/csv",
      periodStart: new Date("2026-07-01T00:00:00.000Z"),
      periodEnd: new Date("2026-07-31T00:00:00.000Z"),
      reportingCurrency: "USD",
      text: "reportDate,storeName,platformName,countryCode,currencyCode,labelSlug,artistSlug,releaseTitle,trackTitle,streamCount,downloadCount,playlistAppearances,grossRevenueMinor,platformFeeMinor,netRevenueMinor,exchangeRate,sourceTransactionId\n",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("daha önce içe aktarılmış");
  });
});
