"use server";

import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";
import { createClient } from "@/supabase/server";

/**
 * Build a public application URL used as the redirect destination in auth emails.
 *
 * @returns Base URL string for this app (for example, https://app.example.com)
 */
function getAppBaseUrl() {
  const explicitUrl = process.env.NEXT_SITE_URL;
  const resolvedUrl = explicitUrl ?? "http://labscity.org";
  return resolvedUrl.replace(/\/$/, "");
}

/**
 * Authenticate an existing user with email and password.
 *
 * @param formData - Form data containing `email` and `password`
 * @returns Promise resolving to success/data on login or error message on failure
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("email", "student@school.edu");
 * formData.append("password", "Password123");
 *
 * const result = await loginAction(formData);
 * if (result.success) {
 *   console.log("Logged in");
 * }
 * ```
 */
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // Validate with Zod schema
  try {
    const parsed = loginSchema.parse({ email, password });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email.toLowerCase(),
      password: parsed.password,
    });


    if (error) {
      console.error("Error signing in: ", error);
      return {
        success: false,
        error: error.message ?? "Invalid email or password",
      };
    }

    if (data.user) {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("is_banned")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!userError && userRow?.is_banned) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "This account has been banned.",
        };
      }
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Invalid input" };
  }
}

/**
 * Register a new user account and attach profile metadata.
 *
 * @param formData - Form data containing signup fields (email, password, names, occupation, workplace)
 * @returns Promise resolving to success/data on signup or error message on failure
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("firstName", "Ada");
 * formData.append("lastName", "Lovelace");
 * formData.append("email", "ada@school.edu");
 * formData.append("occupation", "Researcher");
 * formData.append("workplace", "LabScity University");
 * formData.append("password", "Password123");
 * formData.append("confirmPassword", "Password123");
 *
 * const result = await signupAction(formData);
 * if (result.success) {
 *   console.log("Account created");
 * }
 * ```
 */
export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const occupation = formData.get("occupation") as string;
  const workplace = formData.get("workplace") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const supabase = await createClient();

  // Validate with Zod schema
  try {
    const parsed = signupSchema.parse({
      email,
      password,
      confirmPassword: confirmPassword,
      firstName,
      lastName,
      occupation,
      workplace,
    });

    const { data, error } = await supabase.auth.signUp({
      email: parsed.email.toLowerCase(),
      password: parsed.password,
      options: {
        data: {
          first_name: parsed.firstName,
          last_name: parsed.lastName,
          occupation: parsed.occupation,
          workplace: parsed.workplace,
        },
      },
    });

    if (error) {
      console.error("Error signing up: ", error);
      return {
        success: false,
        error: error.message ?? "Failed to create account",
      };
    }
    
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Invalid input" };
  }
}

/**
 * Send a password reset email to the user.
 * Uses Supabase recovery flow and redirects users back to `/reset-password`.
 *
 * @param formData - Form data containing `email`
 * @returns Promise resolving to success or an error message
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("email", "student@school.edu");
 *
 * const result = await forgotPasswordAction(formData);
 * if (result.success) {
 *   console.log("Recovery email sent");
 * }
 * ```
 */
export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  try {
    const parsed = forgotPasswordSchema.parse({ email });
    const baseUrl = getAppBaseUrl();

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.email.toLowerCase(), {
      redirectTo: `${baseUrl}/reset-password`,
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      return {
        success: false,
        error: error.message ?? "Unable to send password reset email",
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Invalid input" };
  }
}

/**
 * Complete a password reset flow by validating the recovery token/code and updating the password.
 * Accepts either `tokenHash` (OTP recovery flow) or `code` (PKCE flow) from the reset link.
 *
 * @param formData - Form data containing `password`, `confirmPassword`, and either `tokenHash` or `code`
 * @returns Promise resolving to success or an error message
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append("tokenHash", "token-from-email-link");
 * formData.append("password", "NewPass123");
 * formData.append("confirmPassword", "NewPass123");
 *
 * const result = await resetPasswordAction(formData);
 * if (result.success) {
 *   console.log("Password updated");
 * }
 * ```
 */
export async function resetPasswordAction(formData: FormData) {
  const tokenHash = formData.get("tokenHash") as string | null;
  const code = formData.get("code") as string | null;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const supabase = await createClient();

  try {
    const parsed = resetPasswordSchema.parse({
      tokenHash: tokenHash ?? undefined,
      code: code ?? undefined,
      password,
      confirmPassword,
    });

    if (parsed.tokenHash) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: parsed.tokenHash,
      });

      if (verifyError) {
        return {
          success: false,
          error: verifyError.message ?? "Invalid or expired reset link",
        };
      }
    } else if (parsed.code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);

      if (exchangeError) {
        return {
          success: false,
          error: exchangeError.message ?? "Invalid or expired reset link",
        };
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.password,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message ?? "Unable to update password",
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Unable to reset password" };
  }
}
