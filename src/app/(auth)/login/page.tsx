import type { Metadata } from "next";
import { loginAction } from "@/lib/actions/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | LabScity",
  description: "Access your LabScity account.",
};

export default function LoginPage() {
  return <LoginForm loginAction={loginAction} />;
}
