import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email("Invalid email address")
    .min(1, { message: "Email is required" })
    .endsWith(".edu", { message: "Only .edu email addresses are allowed" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "One uppercase letter required" })
    .regex(/[0-9]/, { message: "One number required" }),
});

export const signupSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z
    .email("Invalid email address")
    .min(1, { message: "Email is required" })
    .endsWith(".edu", { message: "Only .edu email addresses are allowed" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "One uppercase letter required" })
    .regex(/[0-9]/, { message: "One number required" }),
  confirmPassword: z.string().min(1, { message: "Confirm Password is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;