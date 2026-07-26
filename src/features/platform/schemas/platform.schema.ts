import { z } from "zod";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir HEX renk girin.");

const safeUrlSchema = z
  .url("Geçerli bir URL girin.")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "Yalnızca HTTP veya HTTPS URL kullanılabilir.");

export const themeConfigSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  cardColor: hexColorSchema,
  textColor: hexColorSchema,
  mutedTextColor: hexColorSchema,
  borderColor: hexColorSchema,
  successColor: hexColorSchema,
  warningColor: hexColorSchema,
  errorColor: hexColorSchema,
  buttonBackground: hexColorSchema,
  buttonText: hexColorSchema,
  linkColor: hexColorSchema,
  sidebarColor: hexColorSchema,
  headerColor: hexColorSchema,
  playerColor: hexColorSchema,
  discoverColor: hexColorSchema,
  rankingColor: hexColorSchema,
  popupColor: hexColorSchema,
  borderRadius: z.number().int().min(0).max(32),
  shadowIntensity: z.number().int().min(0).max(100),
  fontFamily: z.string().trim().min(1).max(120),
  containerWidth: z.string().regex(/^\d{3,4}px$/, "Konteyner genişliği piksel olarak girilmelidir."),
  density: z.enum(["COMPACT", "COMFORTABLE", "SPACIOUS"]),
  colorScheme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  gradientsEnabled: z.boolean(),
  customVariables: z.record(z.string().regex(/^--[a-z0-9-]+$/), hexColorSchema).optional(),
});

export const themeUpdateSchema = themeConfigSchema.partial();

export const brandingUpdateSchema = z.object({
  brandName: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160).nullable().optional(),
  logoUrl: safeUrlSchema.nullable().optional(),
  faviconUrl: safeUrlSchema.nullable().optional(),
  supportEmail: z.email().nullable().optional(),
  socialLinks: z.record(z.string().max(30), safeUrlSchema).optional(),
  seoDefaults: z.object({
    title: z.string().trim().max(160).optional(),
    description: z.string().trim().max(320).optional(),
  }).optional(),
});

const domainSchema = z.string().trim().toLowerCase().refine((value) => {
  if (value.length > 253 || value.includes("@") || value.includes("/") || value.includes(":")) {
    return false;
  }
  return value.split(".").every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part));
}, "Alan adı yalnızca geçerli bir hostname olmalıdır.");

export const customDomainSchema = z.object({
  domain: domainSchema,
});

export const siteSectionSchema = z.object({
  sectionType: z.string().trim().min(1).max(60),
  sortOrder: z.number().int().min(0).max(1000),
  active: z.boolean(),
  title: z.string().trim().max(160).nullable().optional(),
  subtitle: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  imageUrl: safeUrlSchema.nullable().optional(),
  background: hexColorSchema.nullable().optional(),
  textAlign: z.enum(["left", "center", "right"]),
  maxItems: z.number().int().min(1).max(50).nullable().optional(),
  dataSource: z.enum([
    "MANUAL",
    "LATEST_RELEASES",
    "TRENDING_RELEASES",
    "GLOBAL_CHART",
    "TURKEY_CHART",
    "FEATURED_ARTISTS",
    "FEATURED_PLAYLISTS",
    "ACTIVE_CAMPAIGN",
    "ACTIVE_REWARD_VOTE",
  ]),
  ctaLabel: z.string().trim().max(80).nullable().optional(),
  ctaUrl: safeUrlSchema.nullable().optional(),
  responsiveConfig: z.record(z.string(), z.unknown()).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const sitePageUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  sections: z.array(siteSectionSchema).max(50),
});

export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  scopes: z.array(z.enum([
    "artists.read",
    "releases.read",
    "tracks.read",
    "charts.read",
    "smart_links.read",
    "analytics.read",
    "releases.write",
    "distribution.submit",
    "webhooks.manage",
  ])).min(1).max(20),
  rateLimitPerMinute: z.number().int().min(1).max(10_000).default(60),
  expiresAt: z.coerce.date().nullable().optional(),
  ipAllowlist: z.array(z.union([z.ipv4(), z.ipv6()])).max(50).optional(),
  domainAllowlist: z.array(domainSchema).max(50).optional(),
});

export const webhookEndpointCreateSchema = z.object({
  url: z.url().refine((value) => new URL(value).protocol === "https:", "Webhook URL HTTPS olmalıdır."),
  description: z.string().trim().max(200).nullable().optional(),
  events: z.array(z.string().regex(/^[a-z][a-z0-9_.-]{2,80}$/)).min(1).max(50),
  headers: z.record(z.string().regex(/^[A-Za-z0-9-]{1,64}$/), z.string().max(500)).optional(),
  failurePolicy: z.enum(["RETRY", "DISABLE_AFTER_LIMIT", "IGNORE"]).default("RETRY"),
  maxAttempts: z.number().int().min(1).max(20).default(8),
});

export const createVoteSchema = z.object({
  campaignId: z.string().cuid(),
  entityId: z.string().cuid(),
  entityType: z.enum(["TRACK", "RELEASE", "ARTIST", "PLAYLIST"]),
  idempotencyKey: z.string().trim().min(16).max(128),
  deviceHash: z.string().trim().min(16).max(128).nullable().optional(),
});

export const discoverConfigUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  swipeEnabled: z.boolean().optional(),
  gridEnabled: z.boolean().optional(),
  listEnabled: z.boolean().optional(),
  defaultView: z.enum(["SWIPE", "GRID", "LIST"]).optional(),
  cardTemplate: z.enum(["MINIMAL", "PREMIUM", "FULL_INFO", "SWIPE", "VIDEO_STYLE"]).optional(),
  playerVisible: z.boolean().optional(),
  commentsEnabled: z.boolean().optional(),
  likesEnabled: z.boolean().optional(),
  dislikesEnabled: z.boolean().optional(),
  playlistEnabled: z.boolean().optional(),
  sharingEnabled: z.boolean().optional(),
  votingEnabled: z.boolean().optional(),
  rewardCampaignEnabled: z.boolean().optional(),
  turkeyFilterEnabled: z.boolean().optional(),
  globalFilterEnabled: z.boolean().optional(),
  explicitPolicy: z.enum(["SHOW", "HIDE", "WARN"]).optional(),
  minimumReleaseAgeDays: z.number().int().min(0).max(3650).optional(),
  sponsorFrequency: z.number().int().min(0).max(100).optional(),
  popupFrequency: z.number().int().min(0).max(100).optional(),
  scoringWeights: z.object({
    validStream: z.number().min(0).max(1).optional(),
    uniqueListener: z.number().min(0).max(1).optional(),
    completionRate: z.number().min(0).max(1).optional(),
    vote: z.number().min(0).max(1).optional(),
    like: z.number().min(0).max(1).optional(),
    share: z.number().min(0).max(1).optional(),
  }).optional(),
});

export type ThemeConfigInput = z.infer<typeof themeConfigSchema>;
export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>;
export type BrandingUpdateInput = z.infer<typeof brandingUpdateSchema>;
export type SitePageUpdateInput = z.infer<typeof sitePageUpdateSchema>;
export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>;
export type WebhookEndpointCreateInput = z.infer<typeof webhookEndpointCreateSchema>;
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type DiscoverConfigUpdateInput = z.infer<typeof discoverConfigUpdateSchema>;
