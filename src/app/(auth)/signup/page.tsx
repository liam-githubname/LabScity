import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Account | LabScity",
  description: "Join the scientific community.",
};

export default function SignupPage() {
  return <SignupForm />;
}