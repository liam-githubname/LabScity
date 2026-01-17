import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | LabScity",
  description: "Access your LabScity account.",
};

export default function LoginPage() {
  return <LoginForm />;
}