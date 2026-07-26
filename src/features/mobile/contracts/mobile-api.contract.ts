import { z } from "zod";
import { passwordPolicySchema } from "@/features/authentication/schemas/password-policy.schema";

export const mobilePlatformSchema = z.enum(["IOS", "ANDROID", "WEB"]);

export const mobileDeviceSchema = z.object({
  deviceId: z.string().trim().min(8).max(160),
  platform: mobilePlatformSchema,
  deviceName: z.string().trim().max(160).optional(),
  appVersion: z.string().trim().min(1).max(40),
  osVersion: z.string().trim().max(80).optional(),
  locale: z.string().trim().max(20).optional(),
  timezone: z.string().trim().max(80).optional(),
});

export const mobileLoginSchema = mobileDeviceSchema.extend({
  email: z.email(),
  password: passwordPolicySchema,
});

export const mobileRefreshSchema = z.object({
  refreshToken: z.string().trim().min(32),
  deviceId: z.string().trim().min(8).max(160),
});

export const mobileRegisterDeviceSchema = mobileDeviceSchema.extend({
  pushToken: z.string().trim().min(20).max(4096).optional(),
  provider: z.enum(["EXPO_PUSH", "FCM", "APNS"]).default("EXPO_PUSH"),
});

export const mobileUploadInitSchema = z.object({
  idempotencyKey: z.string().trim().min(12).max(160),
  kind: z.enum(["AUDIO", "ARTWORK"]),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().min(3).max(120),
  byteSize: z.number().int().positive(),
  checksumSha256: z.string().trim().regex(/^[a-f0-9]{64}$/i).optional(),
});

export const playbackEventSchema = z.object({
  sessionId: z.string().trim().min(8).max(160),
  trackId: z.string().trim().min(1),
  source: z.enum(["DISCOVER", "RELEASE", "ARTIST_PROFILE", "PLAYLIST", "SMART_LINK", "PRESAVE", "SEARCH"]),
  listenedMilliseconds: z.number().int().min(0),
  completed: z.boolean().default(false),
});

export type MobileDeviceInput = z.infer<typeof mobileDeviceSchema>;
export type MobileLoginInput = z.infer<typeof mobileLoginSchema>;
export type MobileRefreshInput = z.infer<typeof mobileRefreshSchema>;
export type MobileRegisterDeviceInput = z.infer<typeof mobileRegisterDeviceSchema>;
export type MobileUploadInitInput = z.infer<typeof mobileUploadInitSchema>;
export type PlaybackEventInput = z.infer<typeof playbackEventSchema>;

export type MobileApiSuccess<TData, TMeta extends Record<string, unknown> = Record<string, never>> = {
  data: TData;
  meta: TMeta;
  requestId: string;
};

export type MobileApiError = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
  requestId: string;
};
