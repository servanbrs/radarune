import { z } from "zod";
import {
  supportedCurrencyCodes,
  supportedPayoutMethodTypes,
} from "@/features/finance/constants/currency";

const currencySchema = z.enum(supportedCurrencyCodes);

const isoCountryCodeSchema = z
  .string()
  .trim()
  .length(2, "Ülke kodu 2 karakter olmalıdır.")
  .transform((value) => value.toUpperCase());

const isrcSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, "ISRC formatı geçersiz.");

const optionalText = (message?: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1, message).optional(),
  );

const optionalIsrcSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  isrcSchema.optional(),
);

export const royaltySplitInputSchema = z.object({
  beneficiaryUserId: z.string().trim().min(1).optional(),
  artistId: z.string().trim().min(1).optional(),
  labelId: z.string().trim().min(1).optional(),
  role: z.enum(["LABEL", "ARTIST", "PRODUCER", "COMPOSER", "LYRICIST", "MANAGER"]),
  participantName: z
    .string()
    .trim()
    .min(2, "Katılımcı adı en az 2 karakter olmalıdır.")
    .max(120, "Katılımcı adı 120 karakterden uzun olamaz."),
  percentageBps: z
    .number()
    .int("Yüzde değeri tam sayı olmalıdır.")
    .min(1, "Yüzde değeri 0'dan büyük olmalıdır.")
    .max(10000, "Yüzde değeri %100'ü geçemez."),
});

export const createPayoutMethodSchema = z.object({
  type: z.enum(supportedPayoutMethodTypes),
  accountHolderName: z
    .string()
    .trim()
    .min(2, "Hesap sahibi adı en az 2 karakter olmalıdır.")
    .max(120, "Hesap sahibi adı 120 karakterden uzun olamaz."),
  bankName: z.string().trim().max(120).optional(),
  iban: z.string().trim().max(64).optional(),
  payoneerEmail: z.email("Geçerli bir Payoneer e-postası girin.").optional(),
  wiseRecipientId: z.string().trim().max(120).optional(),
  stripeConnectAccountId: z.string().trim().max(120).optional(),
});

export const payoutRequestSchema = z.object({
  statementId: z.string().trim().min(1),
  payoutMethodId: z.string().trim().min(1),
  amountMinor: z.bigint().positive("Ödeme tutarı sıfırdan büyük olmalıdır."),
  currencyCode: currencySchema,
});

export const payoutDecisionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Açıklama en az 3 karakter olmalıdır.")
    .max(280, "Açıklama 280 karakterden uzun olamaz."),
});

export const financialAdjustmentSchema = z.object({
  statementId: z.string().trim().min(1),
  amountMinor: z.bigint().positive("Düzeltme tutarı pozitif olmalıdır."),
  currencyCode: currencySchema,
  direction: z.enum(["CREDIT", "DEBIT"]),
  reason: z
    .string()
    .trim()
    .min(3, "Düzeltme nedeni en az 3 karakter olmalıdır.")
    .max(280, "Düzeltme nedeni 280 karakterden uzun olamaz."),
});

export const generateRoyaltyReportSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  reportingCurrency: currencySchema,
  radaruneCommissionBps: z
    .number()
    .int("Komisyon tam sayı basis point olmalıdır.")
    .min(0, "Komisyon negatif olamaz.")
    .max(10000, "Komisyon %100'ü geçemez."),
});

export const analyticsFiltersSchema = z.object({
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  artistId: z.string().trim().min(1).optional(),
  labelId: z.string().trim().min(1).optional(),
  releaseTitle: z.string().trim().min(1).optional(),
  trackKey: z.string().trim().min(1).optional(),
  storeName: z.string().trim().min(1).optional(),
  countryCode: isoCountryCodeSchema.optional(),
});

export const revenueImportCsvRowSchema = z
  .object({
    reportDate: z.coerce.date(),
    storeName: z.string().trim().min(1, "Store alanı zorunludur."),
    platformName: z.string().trim().min(1, "Platform alanı zorunludur."),
    countryCode: isoCountryCodeSchema,
    currencyCode: currencySchema,
    labelSlug: optionalText(),
    artistSlug: optionalText(),
    releaseTitle: z.string().trim().min(1, "Release title alanı zorunludur."),
    trackTitle: z.string().trim().min(1, "Track title alanı zorunludur."),
    isrc: optionalIsrcSchema,
    upc: optionalText().pipe(z.string().max(32).optional()),
    streamCount: z.coerce.number().int().min(0),
    downloadCount: z.coerce.number().int().min(0),
    playlistAppearances: z.coerce.number().int().min(0).default(0),
    grossRevenueMinor: z.coerce.bigint(),
    platformFeeMinor: z.coerce.bigint(),
    netRevenueMinor: z.coerce.bigint(),
    exchangeRate: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,8})?$/, "Kur formatı geçersiz.")
      .refine((value) => Number(value) > 0, "Kur sıfırdan büyük olmalıdır."),
    sourceTransactionId: z
      .string()
      .trim()
      .min(1, "sourceTransactionId alanı zorunludur."),
  })
  .superRefine((value, ctx) => {
    if (value.grossRevenueMinor < 0n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Negatif brüt gelir kabul edilmez.",
        path: ["grossRevenueMinor"],
      });
    }

    if (value.platformFeeMinor < 0n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Negatif platform ücreti kabul edilmez.",
        path: ["platformFeeMinor"],
      });
    }

    if (value.netRevenueMinor < 0n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Negatif net gelir kabul edilmez.",
        path: ["netRevenueMinor"],
      });
    }

    if (!value.artistSlug && !value.isrc && !value.upc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Artist slug, ISRC veya UPC alanlarından en az biri gereklidir.",
        path: ["artistSlug"],
      });
    }

    if (value.grossRevenueMinor - value.platformFeeMinor !== value.netRevenueMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Net gelir, brüt gelir eksi platform ücreti ile uyuşmalıdır.",
        path: ["netRevenueMinor"],
      });
    }
  });

export type RevenueImportCsvRowInput = z.infer<typeof revenueImportCsvRowSchema>;
export type RoyaltySplitInput = z.infer<typeof royaltySplitInputSchema>;
export type CreatePayoutMethodInput = z.infer<typeof createPayoutMethodSchema>;
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;
export type PayoutDecisionInput = z.infer<typeof payoutDecisionSchema>;
export type FinancialAdjustmentInput = z.infer<typeof financialAdjustmentSchema>;
export type GenerateRoyaltyReportInput = z.infer<typeof generateRoyaltyReportSchema>;
export type AnalyticsFiltersInput = z.infer<typeof analyticsFiltersSchema>;
