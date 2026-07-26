export const supportedCurrencyCodes = ["TRY", "USD", "EUR"] as const;

export type SupportedCurrencyCode = (typeof supportedCurrencyCodes)[number];

export const supportedPayoutMethodTypes = [
  "PAYONEER",
  "WISE",
  "IBAN",
  "STRIPE_CONNECT",
] as const;

export type SupportedPayoutMethodType =
  (typeof supportedPayoutMethodTypes)[number];
