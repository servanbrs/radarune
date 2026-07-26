import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const createOrganization = vi.fn();
const createMembership = vi.fn();
const createInstallationState = vi.fn();
const transaction = vi.fn();

const transactionClient = {
  organization: { create: createOrganization },
  organizationMembership: { create: createMembership },
  installationState: { create: createInstallationState },
};

vi.mock("@/server/prisma/prisma", () => ({
  prisma: { $transaction: transaction },
}));

describe("OrganizationRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(
      async (callback: (client: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
    createOrganization.mockResolvedValue({
      id: "org_1",
      name: "Radarune Records",
      slug: "radarune-records",
      tenantStatus: "ACTIVE",
      onboardingCompletedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createMembership.mockResolvedValue({ id: "membership_1" });
    createInstallationState.mockResolvedValue({ id: "installation_1" });
  });

  it("yeni workspace'i aktif tenant ve tamamlanmış kurulum olarak atomik oluşturur", async () => {
    const { OrganizationRepository } = await import(
      "@/features/organization/server/repositories/organization.repository"
    );

    const repository = new OrganizationRepository();
    await repository.createOrganizationForOwner("user_1", {
      name: "Radarune Records",
      slug: "radarune-records",
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerUserId: "user_1",
          tenantStatus: "ACTIVE",
          onboardingCompletedAt: expect.any(Date),
        }),
      }),
    );
    expect(createMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_1",
          role: "OWNER",
          tenantRole: "OWNER",
          status: "ACTIVE",
        }),
      }),
    );
    expect(createInstallationState).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          currentStep: "COMPLETED",
          completedAt: expect.any(Date),
          lockedAt: expect.any(Date),
        }),
      }),
    );
  });
});
