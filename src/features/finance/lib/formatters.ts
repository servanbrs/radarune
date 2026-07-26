import type { SupportedCurrencyCode } from "@/features/finance/constants/currency";

export function formatMinorMoney(
  amountMinor: bigint,
  currencyCode: SupportedCurrencyCode,
) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountMinor) / 100);
}

export function maskSensitiveValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value.length <= 4) {
    return "*".repeat(value.length);
  }

  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}
