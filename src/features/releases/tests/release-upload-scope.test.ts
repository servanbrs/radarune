import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma/prisma", () => ({ prisma: {} }));

import { ReleaseRepository } from "@/features/releases/server/repositories/release.repository";

describe("ReleaseRepository.attachUpload", () => {
  it("başka organization dosyasını ilişkilendirmeyi reddeder", async () => {
    const client = {
      upload: { findFirst: vi.fn().mockResolvedValue(null) },
      track: { findFirst: vi.fn() },
      release: { updateMany: vi.fn() },
    } as never;

    await expect(new ReleaseRepository().attachUpload({
      releaseId: "release_1",
      organizationId: "org_1",
      uploadId: "upload_from_org_2",
      kind: "ARTWORK",
    }, client)).rejects.toThrow("bu organizasyona ait değil");
  });
});
