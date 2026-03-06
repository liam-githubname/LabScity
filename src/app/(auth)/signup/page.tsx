import type { Metadata } from "next";
import { signupAction } from "@/lib/actions/auth";
import { LSSignupForm } from "@/components/auth/ls-signup-form";

export const metadata: Metadata = {
  title: "Create Account | LabScity",
  description: "Join the scientific community.",
};

/** Signup route; renders LSSignupForm with signupAction. */
export default function SignupPage() {
  return <LSSignupForm signupAction={signupAction} />;
}
