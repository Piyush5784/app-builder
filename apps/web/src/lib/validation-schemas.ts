import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const registerFormSchema = z
  .object({
    email: z.email(),
    password: z.string(),
    username: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const accountSchema = z.object({
  name: z.string().min(2, "Name is required"),
});

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: z.string().min(6, "Password must be at least 6 chars"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 chars"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AccountFormType = z.infer<typeof accountSchema>;
export type PasswordFormType = z.infer<typeof passwordFormSchema>;
export type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;
