"use server";

import { supabase } from "./SupabaseClient";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password: password,
  });

  if (error) {
    console.error("Error signing up: ", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function signupAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password: password,
  });

  if (error) {
    console.error("Error signing up: ", error);
    return { success: false, error };
  }

  return { success: true, data };
}
