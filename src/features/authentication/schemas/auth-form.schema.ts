import { z } from "zod";
import { passwordPolicySchema } from "@/features/authentication/schemas/password-policy.schema";

export const signInFormSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: passwordPolicySchema,
});

export const signUpFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name must be 80 characters or less."),
    email: z.email("Enter a valid email address."),
    password: passwordPolicySchema,
    confirmPassword: passwordPolicySchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
