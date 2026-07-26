import { describe, expect, it } from "vitest";
import {
  mobileLoginSchema,
  mobileUploadInitSchema,
  playbackEventSchema,
} from "@/features/mobile/contracts/mobile-api.contract";

describe("mobile API contracts", () => {
  it("mobil login için cihaz bilgilerini zorunlu tutar", () => {
    const parsed = mobileLoginSchema.safeParse({
      email: "artist@radarune.com",
      password: "super-secret",
      deviceId: "ios-device-123",
      platform: "IOS",
      appVersion: "1.0.0",
    });

    expect(parsed.success).toBe(true);
  });

  it("upload init checksum formatını doğrular", () => {
    const parsed = mobileUploadInitSchema.safeParse({
      idempotencyKey: "upload-operation-1",
      kind: "AUDIO",
      fileName: "track.wav",
      mimeType: "audio/wav",
      byteSize: 1024,
      checksumSha256: "invalid",
    });

    expect(parsed.success).toBe(false);
  });

  it("playback event için negatif dinleme süresini reddeder", () => {
    const parsed = playbackEventSchema.safeParse({
      sessionId: "playback-session-1",
      trackId: "track_1",
      source: "DISCOVER",
      listenedMilliseconds: -1,
      completed: false,
    });

    expect(parsed.success).toBe(false);
  });
});
