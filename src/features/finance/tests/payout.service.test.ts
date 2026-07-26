import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const findMethodById = vi.fn();
const findDuplicateOpenPayout = vi.fn();
const createPayout = vi.fn();
const findPayoutById = vi.fn();
const approvePayout = vi.fn();

const getStatementDetail = vi.fn();
const auditCreate = vi.fn();
const transactionMock = vi.fn(async (handler: (tx: object) => Promise<unknown>) =>
  handler({}),
);

vi.mock("@/features/finance/server/repositories/payout.repository", () => ({
  payoutRepository: {
    listPayoutsByOrganization: vi.fn(),
    findMethodById,
    findDuplicateOpenPayout,
    createPayout,
    findPayoutById,
    approvePayout,
    cancelPayout: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/services/financial-statement.service", () => ({
  financialStatementService: {
    getStatementDetail,
    listStatements: vi.fn(),
  },
}));
vi.mock("@/features/finance/server/services/audit-log.service", () => ({
  auditLogService: {
    create: auditCreate,
  },
}));
vi.mock("@/server/prisma/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

describe("payoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aynı statement için duplicate payout oluşmasını engeller", async () => {
    getStatementDetail.mockResolvedValue({
      id: "statement_1",
      subjectType: "ARTIST",
      currencyCode: "USD",
      closingBalanceMinor: BigInt(100000),
      beneficiaryUserId: "user_1",
      artistId: "artist_1",
      labelId: null,
    });
    findMethodById.mockResolvedValue({
      id: "method_1",
      organizationId: "org_1",
      isActive: true,
      artistId: "artist_1",
      labelId: null,
    });
    findDuplicateOpenPayout.mockResolvedValue({
      id: "payout_existing",
    });

    const { payoutService } = await import("@/features/finance/server/services/payout.service");
    const result = await payoutService.requestPayout(
      {
        organizationId: "org_1",
        membershipRole: "MEMBER",
        systemRole: "ARTIST",
        userId: "user_1",
      },
      {
        statementId: "statement_1",
        payoutMethodId: "method_1",
        amountMinor: BigInt(50000),
        currencyCode: "USD",
      },
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("zaten açık");
  });

  it("yetkisiz kullanıcı label payout talebi açamaz", async () => {
    getStatementDetail.mockResolvedValue({
      id: "statement_2",
      subjectType: "LABEL",
      currencyCode: "USD",
      closingBalanceMinor: BigInt(100000),
      beneficiaryUserId: null,
      artistId: null,
      labelId: "label_1",
    });

    const { payoutService } = await import("@/features/finance/server/services/payout.service");

    await expect(
      payoutService.requestPayout(
        {
          organizationId: "org_1",
          membershipRole: "MEMBER",
          systemRole: "ARTIST",
          userId: "user_2",
        },
        {
          statementId: "statement_2",
          payoutMethodId: "method_2",
          amountMinor: BigInt(50000),
          currencyCode: "USD",
        },
      ),
    ).rejects.toThrow("permission");
  });

  it("transaction hata verirse audit log yazılmaz", async () => {
    findPayoutById.mockResolvedValue({
      id: "payout_1",
      organizationId: "org_1",
      status: "PENDING",
      statementId: "statement_1",
    });
    approvePayout.mockRejectedValue(new Error("db failure"));

    const { payoutService } = await import("@/features/finance/server/services/payout.service");

    await expect(
      payoutService.approvePayout(
        {
          organizationId: "org_1",
          membershipRole: "OWNER",
          systemRole: "ADMIN",
          userId: "user_admin",
        },
        "payout_1",
      ),
    ).rejects.toThrow("db failure");

    expect(auditCreate).not.toHaveBeenCalled();
  });
});
