import { z } from "zod";
import { assertAllowedSlug, assertHttpsUrl, normalizeSlug, stripHtml } from "@/features/growth/lib/security.shared";

const slugSchema = z
  .string()
  .trim()
  .min(3, "Slug en az 3 karakter olmalıdır.")
  .max(80, "Slug en fazla 80 karakter olabilir.")
  .transform(normalizeSlug)
  .refine((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), "Slug küçük harf, rakam ve tire içermelidir.")
  .superRefine((slug, ctx) => {
    try {
      assertAllowedSlug(slug);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Slug kullanılamaz.",
      });
    }
  });

const optionalSlugSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  slugSchema.optional(),
);

const httpsUrlSchema = z
  .string()
  .trim()
  .url("Geçerli URL girin.")
  .transform((value, ctx) => {
    try {
      return assertHttpsUrl(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "URL kabul edilmedi.",
      });
      return z.NEVER;
    }
  });

export const createSmartLinkSchema = z.object({
  artistId: z.string().min(1),
  releaseId: z.string().min(1).optional(),
  title: z.string().trim().min(2).max(160).transform(stripHtml),
  slug: slugSchema,
  description: z.string().trim().max(2000).transform(stripHtml).optional(),
  coverImageUrl: httpsUrlSchema.optional(),
  ctaText: z.string().trim().min(1).max(60).transform(stripHtml).default("Dinle"),
  seoTitle: z.string().trim().max(60).transform(stripHtml).optional(),
  seoDescription: z.string().trim().max(160).transform(stripHtml).optional(),
  ogImageUrl: httpsUrlSchema.optional(),
  active: z.boolean().default(false),
  platforms: z
    .array(
      z.object({
        platform: z.enum([
          "SPOTIFY",
          "APPLE_MUSIC",
          "YOUTUBE_MUSIC",
          "YOUTUBE",
          "DEEZER",
          "AMAZON_MUSIC",
          "TIDAL",
          "SOUNDCLOUD",
          "TIKTOK",
          "INSTAGRAM",
          "FACEBOOK",
          "PANDORA",
          "SHAZAM",
          "BANDCAMP",
          "CUSTOM",
        ]),
        url: httpsUrlSchema,
        sortOrder: z.number().int().min(0).default(0),
        active: z.boolean().default(true),
        buttonText: z.string().trim().max(80).transform(stripHtml).optional(),
      }),
    )
    .default([]),
});

export const updateSmartLinkSchema = createSmartLinkSchema;

export const createPreSaveCampaignSchema = z
  .object({
    artistId: z.string().min(1),
    releaseId: z.string().min(1),
    name: z.string().trim().min(2).max(160).transform(stripHtml),
    slug: slugSchema,
    description: z.string().trim().max(2000).transform(stripHtml).optional(),
    releaseDate: z.coerce.date(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    emailCaptureEnabled: z.boolean().default(true),
    marketingConsentText: z.string().trim().max(2000).transform(stripHtml).optional(),
    successMessage: z.string().trim().min(3).max(500).transform(stripHtml),
    redirectUrl: httpsUrlSchema.optional(),
    active: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.endDate > value.releaseDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kampanya bitiş tarihi yayın tarihinden sonra olamaz.",
        path: ["endDate"],
      });
    }
    if (value.startDate > value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Başlangıç tarihi bitiş tarihinden sonra olamaz.",
        path: ["startDate"],
      });
    }
  });

export const preSaveEmailSubscribeSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  marketingConsent: z.boolean(),
}).superRefine((value, ctx) => {
  if (!value.marketingConsent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Açık rıza zorunludur.",
      path: ["marketingConsent"],
    });
  }
});

export const followArtistSchema = z.object({
  artistId: z.string().min(1),
});

export const likeSchema = z.object({
  releaseId: z.string().min(1).optional(),
  trackId: z.string().min(1).optional(),
  externalMediaId: z.string().min(1).optional(),
}).refine((value) => [value.releaseId, value.trackId, value.externalMediaId].filter(Boolean).length === 1, {
  message: "Tek bir içerik seçilmelidir.",
});

export const createCommentSchema = z.object({
  releaseId: z.string().min(1).optional(),
  trackId: z.string().min(1).optional(),
  externalMediaId: z.string().min(1).optional(),
  playlistId: z.string().min(1).optional(),
  storyId: z.string().min(1).optional(),
  parentCommentId: z.string().min(1).optional(),
  content: z.string().trim().min(2).max(2000).transform(stripHtml),
});

export const createPlaylistSchema = z.object({
  name: z.string().trim().min(2).max(120).transform(stripHtml),
  slug: optionalSlugSchema,
  description: z.string().trim().max(2000).transform(stripHtml).optional(),
  public: z.boolean().default(false),
});

const globalPlaylistFields = z.object({
  name: z.string().trim().min(2, "Playlist adı en az 2 karakter olmalı.").max(120).transform(stripHtml),
  slug: slugSchema,
  description: z.string().trim().max(2000).transform(stripHtml).optional(),
  featured: z.boolean().default(false),
  votingEnabled: z.boolean().default(true),
  voteEndsAt: z.coerce.date(),
});

function validateGlobalPlaylistVoteDate(value: { voteEndsAt?: Date | undefined }, ctx: z.RefinementCtx) {
  if (value.voteEndsAt !== undefined && value.voteEndsAt <= new Date()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Oylama bitiş tarihi gelecekte olmalı.", path: ["voteEndsAt"] });
  }
}

export const globalPlaylistCreateSchema = globalPlaylistFields.superRefine((value, ctx) => {
  if (value.voteEndsAt <= new Date()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Oylama bitiş tarihi gelecekte olmalı.", path: ["voteEndsAt"] });
  }
});

export const globalPlaylistUpdateSchema = globalPlaylistFields.partial().superRefine(validateGlobalPlaylistVoteDate);

export const adminPlaylistUpdateSchema = createPlaylistSchema.partial();

export const globalPlaylistTrackSchema = z.object({
  trackId: z.string().cuid(),
});

export const discoverEventSchema = z.object({
  trackId: z.string().min(1),
  eventType: z.enum([
    "IMPRESSION",
    "PLAY",
    "PAUSE",
    "SKIP",
    "LIKE",
    "DISLIKE",
    "COMPLETE",
    "PROFILE_OPEN",
    "ADD_TO_PLAYLIST",
    "SHARE",
  ]),
});

export const contentReportSchema = z.object({
  entityType: z.enum(["Comment", "Story", "Playlist", "Artist", "SmartLink", "Release"]),
  entityId: z.string().min(1),
  reason: z.enum(["SPAM", "HARASSMENT", "COPYRIGHT", "INAPPROPRIATE_CONTENT", "IMPERSONATION", "MISLEADING", "OTHER"]),
  details: z.string().trim().max(2000).transform(stripHtml).optional(),
});

export type CreateSmartLinkInput = z.infer<typeof createSmartLinkSchema>;
export type CreatePreSaveCampaignInput = z.infer<typeof createPreSaveCampaignSchema>;
export type PreSaveEmailSubscribeInput = z.infer<typeof preSaveEmailSubscribeSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type GlobalPlaylistCreateInput = z.infer<typeof globalPlaylistCreateSchema>;
export type GlobalPlaylistUpdateInput = z.infer<typeof globalPlaylistUpdateSchema>;
export type AdminPlaylistUpdateInput = z.infer<typeof adminPlaylistUpdateSchema>;
export type GlobalPlaylistTrackInput = z.infer<typeof globalPlaylistTrackSchema>;
