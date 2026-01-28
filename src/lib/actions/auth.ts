"use server";

import { z } from "zod";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { createClient } from "@/supabase/server";
// import { supabase } from "./SupabaseClient";

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

    console.log("makes it past the try catch:", data);
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

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
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
    });

    const { data, error } = await supabase.auth.signUp({
      email: parsed.email.toLowerCase(),
      password: parsed.password,
    });

    if (error) {
      console.error("Error signing up: ", error);
      return {
        success: false,
        error: error.message ?? "Failed to create account",
      };
    }
    
    // Insert user data into Users table
    if (data.user) {
      const { error: userInsertError } = await supabase
        .from("Users")
        .insert([
          {
            email: parsed.email.toLowerCase(),
            first_name: parsed.firstName,
            last_name: parsed.lastName,
            created_at: new Date().toISOString(),
          },
        ]);

      if (userInsertError) {
        console.error("Error inserting user: ", userInsertError);
        return {
          success: false,
          error: "Failed to create user",
        };
      }

      // Insert mostly empty profile into Profile table
      const { error: profileInsertError } = await supabase
        .from("Profile")
        .insert([
          {
            first_name: parsed.firstName,
            last_name: parsed.lastName,
          },
        ]);

      if (profileInsertError) {
        console.error("Error inserting profile: ", profileInsertError);
        return {
          success: false,
          error: "Failed to create profile",
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
