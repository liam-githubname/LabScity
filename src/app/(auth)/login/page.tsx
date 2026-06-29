import type { Metadata } from "next";
import { loginAction } from "@/lib/actions/auth";
import { LSLoginForm } from "@/components/auth/ls-login-form";

export const metadata: Metadata = {
  title: "Login | LabScity",
  description: "Access your LabScity account.",
};

/** Login route; renders LSLoginForm with loginAction. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ banned?: string }>;
}) {
  const params = await searchParams;
  const showBannedMessage = params?.banned === "1";
  return <LSLoginForm loginAction={loginAction} showBannedMessage={showBannedMessage} />;
}
