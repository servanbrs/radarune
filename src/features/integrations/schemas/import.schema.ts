import { z } from "zod";

export const importSourceTypeSchema = z.enum([
  "YOUTUBE_SEARCH",
  "YOUTUBE_CHANNEL",
  "YOUTUBE_PLAYLIST",
  "SPOTIFY_ARTIST",
  "SPOTIFY_PLAYLIST",
  "SPOTIFY_ALBUM",
  "SPOTIFY_SEARCH",
  "MANUAL_URL",
]);

export const importSourceCreateSchema = z.object({
  type: importSourceTypeSchema,
  url: z.url().max(1024).optional().or(z.literal("")),
  query: z.string().trim().min(1).max(160).optional(),
  name: z.string().trim().min(1).max(160),
  artistId: z.string().cuid().optional(),
  active: z.boolean().default(false),
  autoPublish: z.boolean().default(false),
  requiresReview: z.boolean().default(true),
  minDurationMs: z.number().int().nonnegative().nullable().optional(),
  maxDurationMs: z.number().int().positive().nullable().optional(),
  maxAgeDays: z.number().int().positive().nullable().optional(),
  maxItems: z.number().int().min(1).max(200).default(100),
  frequencyMinutes: z.number().int().min(5).max(43_200).default(60),
  scheduleMode: z.enum(["WORKER", "CRON", "MANUAL", "DATABASE_POLLING"]).default("CRON"),
});

export const importModerationDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().trim().min(1).max(2_000),
});

export type ImportSourceCreateInput = z.infer<typeof importSourceCreateSchema>;
export type ImportModerationDecisionInput = z.infer<typeof importModerationDecisionSchema>;
