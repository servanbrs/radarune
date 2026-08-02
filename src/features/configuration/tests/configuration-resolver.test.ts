import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/server/prisma/prisma", () => ({
  prisma: { adminSetting: { findMany } },
}));

import { configurationResolver } from "@/features/configuration/server/configuration-resolver.service";

describe("configurationResolver", () => {
  beforeEach(() => {
    findMany.mockReset();
    configurationResolver.resetForTests();
  });

  it("organization > platform > environment > default önceliğini uygular", async () => {
    findMany.mockResolvedValue([
      { organizationId: null, value: "platform" },
      { organizationId: "org-1", value: "organization" },
    ]);

    const result = await configurationResolver.resolve({
      key: "PLATFORM_NAME",
      organizationId: "org-1",
      environmentValue: "environment",
      defaultValue: "default",
    });

    expect(result.value).toBe("organization");
    expect(result.source).toBe("ORGANIZATION");
  });

  it("boş/uygunsuz değer parser tarafından reddedilirse sonraki kaynağa geçer", async () => {
    findMany.mockResolvedValue([{ organizationId: "org-1", value: "" }]);

    const result = await configurationResolver.resolve({
      key: "SUPPORT_EMAIL",
      organizationId: "org-1",
      environmentValue: "env@example.com",
      defaultValue: "default@example.com",
      parse: (value) => (typeof value === "string" && value.includes("@") ? value : undefined),
    });

    expect(result.value).toBe("env@example.com");
    expect(result.source).toBe("ENVIRONMENT");
  });

  it("aynı anahtar için TTL içinde cache kullanır ve invalidate sonrası tekrar okur", async () => {
    findMany.mockResolvedValue([{ organizationId: null, value: "cached" }]);

    await configurationResolver.resolve({ key: "PLATFORM_NAME", defaultValue: "default" });
    const cached = await configurationResolver.resolve({ key: "PLATFORM_NAME", defaultValue: "default" });
    expect(cached.cached).toBe(true);
    expect(findMany).toHaveBeenCalledTimes(1);

    configurationResolver.invalidate({ key: "PLATFORM_NAME" });
    await configurationResolver.resolve({ key: "PLATFORM_NAME", defaultValue: "default" });
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
