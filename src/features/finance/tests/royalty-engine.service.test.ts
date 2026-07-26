import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/finance/server/services/audit-log.service", () => ({
  auditLogService: {
    create: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/repositories/exchange-rate.repository", () => ({
  exchangeRateRepository: {
    findLatestRate: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/repositories/financial-statement.repository", () => ({
  financialStatementRepository: {
    findLatestStatementBeforePeriod: vi.fn(),
    createManyStatements: vi.fn(),
    sumAdjustmentsForSubjectInPeriod: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/repositories/payout.repository", () => ({
  payoutRepository: {
    sumPaidWithdrawalsForSubjectInPeriod: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/repositories/revenue-import.repository", () => ({
  revenueImportRepository: {
    hasCompletedImportsForPeriod: vi.fn(),
    listStoreRevenueRowsForPeriod: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/repositories/royalty.repository", () => ({
  royaltyRepository: {
    createSplit: vi.fn(),
    listSplitsByTrackKeys: vi.fn(),
    findExistingReport: vi.fn(),
    createRevenueReport: vi.fn(),
    createRoyaltyReport: vi.fn(),
    createRoyaltyLines: vi.fn(),
    listReportsByOrganization: vi.fn(),
    getReportWithLines: vi.fn(),
  },
}));
vi.mock("@/server/prisma/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (handler: (tx: object) => Promise<unknown>) => handler({})),
  },
}));

describe("royaltyEngineService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("royalty split toplamı %100 değilse reddeder", async () => {
    const { royaltyEngineService } = await import(
      "@/features/finance/server/services/royalty-engine.service"
    );

    await expect(
      royaltyEngineService.createTrackSplits(
        {
          organizationId: "org_1",
          membershipRole: "ADMIN",
          systemRole: "ADMIN",
          userId: "user_1",
        },
        {
          trackKey: "isrc:abc",
          trackTitle: "Test Track",
          splits: [
            {
              role: "ARTIST",
              participantName: "Artist A",
              percentageBps: 6000,
            },
            {
              role: "PRODUCER",
              participantName: "Producer B",
              percentageBps: 3000,
            },
          ],
        },
      ),
    ).rejects.toThrow("%100");
  });
});
