import { z } from "zod";
import { passwordPolicySchema } from "@/features/authentication/schemas/password-policy.schema";

export const signInFormSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin."),
  password: passwordPolicySchema,
});

export const signUpFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Ad soyad en az 2 karakter olmalı.")
      .max(80, "Ad soyad 80 karakteri aşamaz."),
    email: z.email("Geçerli bir e-posta adresi girin."),
    password: passwordPolicySchema,
    confirmPassword: passwordPolicySchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
