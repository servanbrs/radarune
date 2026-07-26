import { describe, expect, it } from "vitest";
import { assertSafeStorageKey, resolveStoragePath } from "@/features/storage/server/lib/storage-path";

describe("storage path security", () => {
  it("path traversal anahtarlarını reddeder", () => {
    expect(() => assertSafeStorageKey("../secret.txt")).toThrow();
    expect(() => assertSafeStorageKey("private/../../secret.txt")).toThrow();
    expect(() => resolveStoragePath("/tmp/radarune-storage", "/etc/passwd")).toThrow();
  });

  it("güvenli object key'i storage root altında çözer", () => {
    expect(resolveStoragePath("/tmp/radarune-storage", "private/uploads/file.wav")).toBe("/tmp/radarune-storage/private/uploads/file.wav");
  });
});
