import type { Metadata } from "next";
import { signupAction } from "@/lib/actions/auth";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Account | LabScity",
  description: "Join the scientific community.",
};

export default function SignupPage() {
  return <SignupForm signupAction={signupAction} />;
}
