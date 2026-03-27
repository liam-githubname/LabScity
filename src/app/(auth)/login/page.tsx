import type { Metadata } from "next";
import { loginAction } from "@/lib/actions/auth";
import { LSLoginForm } from "@/components/auth/ls-login-form";

export const metadata: Metadata = {
  title: "Login | LabScity",
  description: "Access your LabScity account.",
};

/** Login route; renders LSLoginForm with loginAction. */
export default function LoginPage({
  searchParams,
}: {
  searchParams?: { banned?: string };
}) {
  const showBannedMessage = searchParams?.banned === "1";
  return <LSLoginForm loginAction={loginAction} showBannedMessage={showBannedMessage} />;
}
