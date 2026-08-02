import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  DATABASE_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(5),
  DATABASE_ACQUIRE_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(10_000),
  DATABASE_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().min(10).max(3_600).default(300),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  FACEBOOK_CLIENT_ID: z.string().min(1).optional(),
  FACEBOOK_CLIENT_SECRET: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  CONTACT_WEBHOOK_URL: z.url().optional(),
  APP_URL: z.url().optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  CONFIGURATION_ENCRYPTION_KEY: z.string().min(32).optional(),
  SESSION_ENCRYPTION_KEY: z.string().min(32).optional(),
  INTERNAL_WORKER_SECRET: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(32).optional(),
  WEBHOOK_SIGNING_SECRET: z.string().min(32).optional(),
  API_KEY_PEPPER: z.string().min(32).optional(),
  IP_HASH_SALT: z.string().min(32).optional(),
  MAIL_PROVIDER: z.enum(["NONE", "SMTP", "RESEND", "SENDGRID", "AMAZON_SES", "MAILGUN", "POSTMARK"]).default("NONE"),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).optional(),
  SMTP_USERNAME: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM_EMAIL: z.email().optional(),
  BILLING_ENCRYPTION_KEY: z.string().min(32).optional(),
  DISTRIBUTION_ENCRYPTION_KEY: z.string().min(32).optional(),
  BILLING_DEFAULT_PROVIDER: z
    .enum(["STRIPE", "IYZICO", "PAYTR", "MANUAL_BANK_TRANSFER"])
    .optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  IYZICO_API_KEY: z.string().min(1).optional(),
  IYZICO_SECRET_KEY: z.string().min(1).optional(),
  IYZICO_BASE_URL: z.url().optional(),
  PAYTR_MERCHANT_ID: z.string().min(1).optional(),
  PAYTR_MERCHANT_KEY: z.string().min(1).optional(),
  PAYTR_MERCHANT_SALT: z.string().min(1).optional(),
  BILLING_SUCCESS_URL: z.url().optional(),
  BILLING_CANCEL_URL: z.url().optional(),
  MOBILE_TOKEN_ISSUER: z.string().min(1).default("radarune"),
  MOBILE_TOKEN_AUDIENCE: z.string().min(1).default("radarune-mobile"),
  MOBILE_ACCESS_TOKEN_SECRET: z.string().min(32).optional(),
  MOBILE_ENCRYPTION_KEY: z.string().min(32).optional(),
  MOBILE_REFRESH_TOKEN_PEPPER: z.string().min(32).optional(),
  WEBHOOK_ENCRYPTION_KEY: z.string().min(32).optional(),
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  YOUTUBE_API_QUOTA_DAILY_LIMIT: z.coerce.number().int().positive().default(10_000),
  YOUTUBE_IMPORT_ENABLED: z.coerce.boolean().default(false),
  YOUTUBE_IMPORT_CRON_SECRET: z.string().min(32).optional(),
  SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
  SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
  SPOTIFY_IMPORT_ENABLED: z.coerce.boolean().default(false),
  IMPORT_SCHEDULER_MODE: z.enum(["WORKER", "CRON", "MANUAL", "DATABASE_POLLING"]).default("CRON"),
  SEO_CANONICAL_BASE_URL: z.url().optional(),
  STORAGE_PROVIDER: z
    .enum(["LOCAL", "S3", "S3_COMPATIBLE", "CLOUDFLARE_R2", "DIGITALOCEAN_SPACES", "MINIO", "SUPABASE_STORAGE", "AZURE_BLOB", "GOOGLE_CLOUD_STORAGE"])
    .default("LOCAL"),
  STORAGE_LOCAL_ROOT: z.string().min(1).optional(),
  STORAGE_LOCAL_PATH: z.string().min(1).optional(),
  STORAGE_ALLOW_LOCAL_IN_PRODUCTION: z.coerce.boolean().default(false),
  STORAGE_PUBLIC_BASE_URL: z.url().optional(),
  STORAGE_SIGNING_SECRET: z.string().min(32).optional(),
  STORAGE_S3_ENDPOINT: z.url().optional(),
  STORAGE_S3_REGION: z.string().min(1).default("us-east-1"),
  STORAGE_S3_BUCKET: z.string().min(1).optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
  STORAGE_S3_PUBLIC_BASE_URL: z.url().optional(),
  PUSH_NOTIFICATION_PROVIDER: z.enum(["EXPO_PUSH", "FCM", "APNS"]).default("EXPO_PUSH"),
});

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_CONNECTION_LIMIT: process.env.DATABASE_CONNECTION_LIMIT,
  DATABASE_ACQUIRE_TIMEOUT_MS: process.env.DATABASE_ACQUIRE_TIMEOUT_MS,
  DATABASE_CONNECT_TIMEOUT_MS: process.env.DATABASE_CONNECT_TIMEOUT_MS,
  DATABASE_IDLE_TIMEOUT_SECONDS: process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? process.env.SESSION_ENCRYPTION_KEY,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  CONTACT_WEBHOOK_URL: process.env.CONTACT_WEBHOOK_URL,
  APP_URL: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? process.env.CONFIGURATION_ENCRYPTION_KEY,
  CONFIGURATION_ENCRYPTION_KEY: process.env.CONFIGURATION_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY,
  SESSION_ENCRYPTION_KEY: process.env.SESSION_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET,
  INTERNAL_WORKER_SECRET: process.env.INTERNAL_WORKER_SECRET ?? process.env.CRON_SECRET,
  CRON_SECRET: process.env.CRON_SECRET ?? process.env.INTERNAL_WORKER_SECRET,
  WEBHOOK_SIGNING_SECRET: process.env.WEBHOOK_SIGNING_SECRET,
  API_KEY_PEPPER: process.env.API_KEY_PEPPER,
  IP_HASH_SALT: process.env.IP_HASH_SALT,
  MAIL_PROVIDER: process.env.MAIL_PROVIDER,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
  BILLING_ENCRYPTION_KEY: process.env.BILLING_ENCRYPTION_KEY,
  DISTRIBUTION_ENCRYPTION_KEY: process.env.DISTRIBUTION_ENCRYPTION_KEY,
  BILLING_DEFAULT_PROVIDER: process.env.BILLING_DEFAULT_PROVIDER,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  IYZICO_API_KEY: process.env.IYZICO_API_KEY,
  IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY,
  IYZICO_BASE_URL: process.env.IYZICO_BASE_URL,
  PAYTR_MERCHANT_ID: process.env.PAYTR_MERCHANT_ID,
  PAYTR_MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT,
  BILLING_SUCCESS_URL: process.env.BILLING_SUCCESS_URL,
  BILLING_CANCEL_URL: process.env.BILLING_CANCEL_URL,
  MOBILE_TOKEN_ISSUER: process.env.MOBILE_TOKEN_ISSUER,
  MOBILE_TOKEN_AUDIENCE: process.env.MOBILE_TOKEN_AUDIENCE,
  MOBILE_ACCESS_TOKEN_SECRET: process.env.MOBILE_ACCESS_TOKEN_SECRET,
  MOBILE_ENCRYPTION_KEY: process.env.MOBILE_ENCRYPTION_KEY,
  MOBILE_REFRESH_TOKEN_PEPPER: process.env.MOBILE_REFRESH_TOKEN_PEPPER,
  WEBHOOK_ENCRYPTION_KEY: process.env.WEBHOOK_ENCRYPTION_KEY,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  YOUTUBE_API_QUOTA_DAILY_LIMIT: process.env.YOUTUBE_API_QUOTA_DAILY_LIMIT,
  YOUTUBE_IMPORT_ENABLED: process.env.YOUTUBE_IMPORT_ENABLED,
  YOUTUBE_IMPORT_CRON_SECRET: process.env.YOUTUBE_IMPORT_CRON_SECRET,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  SPOTIFY_IMPORT_ENABLED: process.env.SPOTIFY_IMPORT_ENABLED,
  IMPORT_SCHEDULER_MODE: process.env.IMPORT_SCHEDULER_MODE,
  SEO_CANONICAL_BASE_URL: process.env.SEO_CANONICAL_BASE_URL,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  STORAGE_LOCAL_ROOT: process.env.STORAGE_LOCAL_ROOT,
  STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH,
  STORAGE_ALLOW_LOCAL_IN_PRODUCTION: process.env.STORAGE_ALLOW_LOCAL_IN_PRODUCTION,
  STORAGE_PUBLIC_BASE_URL: process.env.STORAGE_PUBLIC_BASE_URL,
  STORAGE_SIGNING_SECRET: process.env.STORAGE_SIGNING_SECRET,
  STORAGE_S3_ENDPOINT: process.env.STORAGE_S3_ENDPOINT,
  STORAGE_S3_REGION: process.env.STORAGE_S3_REGION,
  STORAGE_S3_BUCKET: process.env.STORAGE_S3_BUCKET,
  STORAGE_S3_ACCESS_KEY_ID: process.env.STORAGE_S3_ACCESS_KEY_ID,
  STORAGE_S3_SECRET_ACCESS_KEY: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
  STORAGE_S3_FORCE_PATH_STYLE: process.env.STORAGE_S3_FORCE_PATH_STYLE,
  STORAGE_S3_PUBLIC_BASE_URL: process.env.STORAGE_S3_PUBLIC_BASE_URL,
  PUSH_NOTIFICATION_PROVIDER: process.env.PUSH_NOTIFICATION_PROVIDER,
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsedEnv.error.flatten().fieldErrors, null, 2)}`,
  );
}

export const env = parsedEnv.data;

const productionUrl = (value: string | undefined) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export function getProductionEnvironmentIssues(): string[] {
  if (env.NODE_ENV !== "production") return [];
  const issues: string[] = [];
  if (!productionUrl(env.APP_URL)) issues.push("APP_URL HTTPS olmalıdır.");
  if (!productionUrl(env.BETTER_AUTH_URL)) issues.push("BETTER_AUTH_URL HTTPS olmalıdır.");
  if (!productionUrl(env.NEXT_PUBLIC_APP_URL)) issues.push("NEXT_PUBLIC_APP_URL HTTPS olmalıdır.");
  for (const [key, value] of Object.entries({
    ENCRYPTION_KEY: env.ENCRYPTION_KEY,
    CONFIGURATION_ENCRYPTION_KEY: env.CONFIGURATION_ENCRYPTION_KEY ?? env.ENCRYPTION_KEY,
    SESSION_ENCRYPTION_KEY: env.SESSION_ENCRYPTION_KEY ?? env.BETTER_AUTH_SECRET,
    INTERNAL_WORKER_SECRET: env.INTERNAL_WORKER_SECRET ?? env.CRON_SECRET,
    CRON_SECRET: env.CRON_SECRET,
    WEBHOOK_SIGNING_SECRET: env.WEBHOOK_SIGNING_SECRET,
    API_KEY_PEPPER: env.API_KEY_PEPPER,
    IP_HASH_SALT: env.IP_HASH_SALT,
  })) {
    if (!value || value.length < 32) issues.push(`${key} production ortamında en az 32 karakter olmalıdır.`);
  }
  if (env.STORAGE_PROVIDER === "LOCAL" && (!env.STORAGE_ALLOW_LOCAL_IN_PRODUCTION || !(env.STORAGE_LOCAL_ROOT ?? env.STORAGE_LOCAL_PATH))) {
    issues.push("LOCAL storage production için açıkça etkinleştirilmeli ve kalıcı bir yol tanımlanmalıdır.");
  }
  if (env.MAIL_PROVIDER === "SMTP" && (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USERNAME || !env.SMTP_PASSWORD || !env.SMTP_FROM_EMAIL)) {
    issues.push("SMTP provider için SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD ve SMTP_FROM_EMAIL gereklidir.");
  }
  return issues;
}

export function assertProductionEnvironment() {
  const issues = getProductionEnvironmentIssues();
  if (issues.length > 0) throw new Error(`Production environment geçersiz:\n${issues.join("\n")}`);
}
