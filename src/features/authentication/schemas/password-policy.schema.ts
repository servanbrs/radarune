import { z } from "zod";

export const passwordPolicySchema = z
  .string()
  .min(6, "Parola en az 6 karakter olmalıdır.")
  .max(128, "Parola en fazla 128 karakter olabilir.");

export const passwordPolicy = {
  minLength: 6,
  maxLength: 128,
} as const;
