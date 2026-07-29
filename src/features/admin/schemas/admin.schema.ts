import { z } from "zod";

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ARTIST", "MODERATOR", "ADMIN", "SUPER_ADMIN"]),
  reason: z.string().trim().min(10, "Sebep en az 10 karakter olmalıdır.").max(1000),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
  reason: z.string().trim().min(10, "Sebep en az 10 karakter olmalıdır.").max(1000),
});

export const artistApplicationActionSchema = z.object({
  action: z.enum(["START_REVIEW", "APPROVE", "REJECT", "REQUEST_REVISION"]),
  reason: z.string().trim().max(2000).optional(),
  adminNotes: z.string().trim().max(4000).optional(),
});

export const createArtistApplicationSchema = z.object({
  stageName: z.string().trim().min(2, "Sahne adı en az 2 karakter olmalıdır.").max(160),
  legalName: z.string().trim().min(2, "Yasal ad en az 2 karakter olmalıdır.").max(200),
  biography: z.string().trim().min(10, "Biyografi en az 10 karakter olmalıdır.").max(5000),
  spotifyArtistUrl: z.preprocess((value) => value === "" ? undefined : value, z.string().url("Spotify bağlantısı geçerli değil.").optional()),
  appleMusicArtistUrl: z.preprocess((value) => value === "" ? undefined : value, z.string().url("Apple Music bağlantısı geçerli değil.").optional()),
  youtubeChannelUrl: z.preprocess((value) => value === "" ? undefined : value, z.string().url("YouTube bağlantısı geçerli değil.").optional()),
});

export const releaseModerationActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION", "QUEUE_DISTRIBUTION"]),
  reason: z.string().trim().max(2000).optional(),
  revisionItems: z
    .array(
      z.object({
        category: z.enum([
          "METADATA",
          "ARTWORK",
          "AUDIO",
          "RIGHTS",
          "ARTIST",
          "CONTRIBUTOR",
          "ISRC",
          "UPC",
          "DISTRIBUTION",
          "COPYRIGHT",
          "OTHER",
        ]),
        fieldPath: z.string().trim().min(1).max(200),
        message: z.string().trim().min(3).max(1000),
        severity: z.enum(["INFO", "WARNING", "ERROR"]).default("ERROR"),
      }),
    )
    .default([]),
});

export const updateAdminSettingSchema = z.object({
  key: z.enum([
    "PLATFORM_NAME",
    "LOGO_URL",
    "SUPPORT_EMAIL",
    "SEO_TITLE",
    "SEO_DESCRIPTION",
    "DEFAULT_DISTRIBUTION_PROVIDER",
    "AUTO_DISTRIBUTION_ENABLED",
    "MAX_AUDIO_FILE_SIZE_BYTES",
    "MAX_ARTWORK_FILE_SIZE_BYTES",
    "MIN_ARTWORK_RESOLUTION",
    "USER_REGISTRATION_ENABLED",
    "ARTIST_APPLICATIONS_ENABLED",
    "EMAIL_VERIFICATION_REQUIRED",
    "MAINTENANCE_MODE_ENABLED",
    "MAINTENANCE_MESSAGE",
  ]),
  value: z.union([z.string().trim().max(2000), z.boolean(), z.number().int().nonnegative()]),
  reason: z.string().trim().min(10, "Sebep en az 10 karakter olmalıdır.").max(1000),
});

export type AdminPaginationInput = z.infer<typeof adminPaginationSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ArtistApplicationActionInput = z.infer<typeof artistApplicationActionSchema>;
export type CreateArtistApplicationInput = z.infer<typeof createArtistApplicationSchema>;
export type ReleaseModerationActionInput = z.infer<typeof releaseModerationActionSchema>;
export type UpdateAdminSettingInput = z.infer<typeof updateAdminSettingSchema>;
