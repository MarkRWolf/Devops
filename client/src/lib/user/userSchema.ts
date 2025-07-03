// src/zod/user.ts
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  userName: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((p) => /[0-9]/.test(p), "Must include a digit")
    .refine((p) => /[A-Z]/.test(p), "Must include an uppercase")
    .refine((p) => /[a-z]/.test(p), "Must include a lowercase")
    .refine((p) => /[^A-Za-z0-9]/.test(p), "Must include a special character"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().nonempty("Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
