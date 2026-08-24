import { z } from "zod";

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ARTIST", "MODERATOR", "ADMIN", "SUPER_ADMIN"]),
  reason: z
    .string()
    .trim()
    .min(10, "Sebep en az 10 karakter olmalıdır.")
    .max(1000),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
  reason: z
    .string()
    .trim()
    .min(10, "Sebep en az 10 karakter olmalıdır.")
    .max(1000),
});

export const createAdminUserSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(120),
  email: z.email("Geçerli bir e-posta adresi girin.").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Geçici parola en az 8 karakter olmalıdır.").max(128),
  role: z.enum(["USER", "ARTIST", "MODERATOR", "ADMIN", "SUPER_ADMIN"]),
});

export const artistApplicationActionSchema = z.object({
  action: z.enum(["START_REVIEW", "APPROVE", "REJECT", "REQUEST_REVISION"]),
  reason: z.string().trim().max(2000).optional(),
  adminNotes: z.string().trim().max(4000).optional(),
  verificationConfirmed: z.boolean().optional().default(false),
});

export const createArtistApplicationSchema = z.object({
  // Existing API clients may not send this field yet; they keep the old
  // verified-profile flow. The form sends NEW explicitly for a new channel.
  artistMode: z.enum(["EXISTING", "NEW"]).default("EXISTING"),
  identityConfirmation: z.preprocess(
    (value) => value === true || value === "true" || value === "on",
    z.boolean().default(false),
  ),
  stageName: z
    .string()
    .trim()
    .min(2, "Sahne adı en az 2 karakter olmalıdır.")
    .max(160),
  legalName: z
    .string()
    .trim()
    .min(2, "Yasal ad en az 2 karakter olmalıdır.")
    .max(200),
  biography: z
    .string()
    .trim()
    .min(10, "Biyografi en az 10 karakter olmalıdır.")
    .max(5000),
  spotifyArtistUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("Spotify bağlantısı geçerli değil.").optional(),
  ),
  appleMusicArtistUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("Apple Music bağlantısı geçerli değil.").optional(),
  ),
  youtubeChannelUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("YouTube bağlantısı geçerli değil.").optional(),
  ),
  deezerArtistUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("Deezer bağlantısı geçerli değil.").optional(),
  ),
  itunesArtistUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("iTunes bağlantısı geçerli değil.").optional(),
  ),
  documentReference: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("Doğrulama kanıtı geçerli bir bağlantı olmalıdır.").optional(),
  ),
}).superRefine((data, context) => {
  const proof = [
    data.spotifyArtistUrl,
    data.appleMusicArtistUrl,
    data.youtubeChannelUrl,
    data.deezerArtistUrl,
    data.itunesArtistUrl,
    data.documentReference,
  ].some(Boolean);
  if (!proof) {
    context.addIssue({
      code: "custom",
      path: ["documentReference"],
      message: "Başvuruyu göndermek için en az bir doğrulama kanıtı bağlantısı ekleyin.",
    });
  }
  if (data.artistMode === "NEW" && !data.identityConfirmation) {
    context.addIssue({
      code: "custom",
      path: ["identityConfirmation"],
      message: "Yeni sanatçı başvurusu için gerçek sanatçı/yetkili onayı gereklidir.",
    });
  }
});

export const releaseModerationActionSchema = z.object({
  action: z.enum([
    "APPROVE",
    "REJECT",
    "REQUEST_REVISION",
    "QUEUE_DISTRIBUTION",
  ]),
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
    "SEO_GOOGLE_SITE_VERIFICATION",
    "SEO_INDEXING_ENABLED",
    "SMTP_MAIL_PROVIDER",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_FROM_EMAIL",
    "EMAIL_TEMPLATE_VERIFICATION_SUBJECT",
    "EMAIL_TEMPLATE_VERIFICATION_BODY",
    "EMAIL_TEMPLATE_WELCOME_SUBJECT",
    "EMAIL_TEMPLATE_WELCOME_BODY",
    "EMAIL_TEMPLATE_PASSWORD_RESET_SUBJECT",
    "EMAIL_TEMPLATE_PASSWORD_RESET_BODY",
    "SMTP_FROM_NAME",
    "EMAIL_BRAND_LOGO_URL",
    "EMAIL_BRAND_PRIMARY_COLOR",
    "EMAIL_BRAND_FOOTER_TEXT",
    "EMAIL_TEMPLATE_SIGN_IN_SUBJECT",
    "EMAIL_TEMPLATE_SIGN_IN_BODY",
    "REWARD_EMAIL_VERIFICATION_REQUIRED",
    "REWARD_MIN_ACTIVE_DAYS",
    "REWARD_REAL_INTERACTION_REQUIRED",
  ]),
  value: z.union([
    z.string().trim().max(2000),
    z.boolean(),
    z.number().int().nonnegative(),
  ]),
  reason: z
    .string()
    .trim()
    .min(10, "Sebep en az 10 karakter olmalıdır.")
    .max(1000),
});

export type AdminPaginationInput = z.infer<typeof adminPaginationSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type ArtistApplicationActionInput = z.infer<
  typeof artistApplicationActionSchema
>;
export type CreateArtistApplicationInput = z.infer<
  typeof createArtistApplicationSchema
>;
export type ReleaseModerationActionInput = z.infer<
  typeof releaseModerationActionSchema
>;
export type UpdateAdminSettingInput = z.infer<typeof updateAdminSettingSchema>;
