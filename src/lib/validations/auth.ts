import { z } from "zod";

/** Zod schema for login form: .edu email and password (min 8 chars, one uppercase, one number). */
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

/** Zod schema for signup form: first/last name, .edu email, password with confirm; passwords must match. */
export const signupSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z
    .email("Invalid email address")
    .min(1, { message: "Email is required" })
    .endsWith(".edu", { message: "Only .edu email addresses are allowed" }),
  occupation: z.string().min(2, { message: "Occupation must be at least 2 characters" }),
  workplace: z.string().min(2, { message: "Workplace must be at least 2 characters" }),
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

export const forgotPasswordSchema = z.object({
  email: z
    .email("Invalid email address")
    .min(1, { message: "Email is required" })
    .endsWith(".edu", { message: "Only .edu email addresses are allowed" }),
});

export const resetPasswordSchema = z
  .object({
    tokenHash: z.string().optional(),
    code: z.string().optional(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "One uppercase letter required" })
      .regex(/[0-9]/, { message: "One number required" }),
    confirmPassword: z.string().min(1, { message: "Confirm Password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => Boolean(data.tokenHash || data.code), {
    path: ["tokenHash"],
    message: "Reset token is missing or invalid",
  });

export type LoginValues = z.infer<typeof loginSchema>;
/** Inferred type for signup form values (firstName, lastName, email, password, confirmPassword). */
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
