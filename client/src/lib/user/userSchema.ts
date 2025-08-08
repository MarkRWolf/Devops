// src/zod/user.ts
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((p) => /[0-9]/.test(p), "Must include a digit")
    .refine((p) => /[A-Z]/.test(p), "Must include an uppercase")
    .refine((p) => /[a-z]/.test(p), "Must include a lowercase"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().nonempty("Password is required"),
});

export const gitHubPatSchema = z.object({
  gitHubPat: z.string().min(1, "Personal Access Token is required"),
  gitHubOwnerRepo: z
    .string()
    .min(1, "Owner/Repo cannot be empty.")
    .regex(
      /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/,
      "Invalid owner/repo format. Expected 'owner/repo'."
    ),
});

export const azurePatSchema = z.object({
  azurePat: z.string().min(1, "Azure PAT is required"),
  organization: z.string().min(1, "Organization is required"),
  project: z.string().min(1, "Project is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PatInput = z.infer<typeof gitHubPatSchema>;
export type AzurePatInput = z.infer<typeof azurePatSchema>;
