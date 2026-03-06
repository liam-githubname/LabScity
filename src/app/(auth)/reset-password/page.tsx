//Page to send users to in the reset password email 
//TODO: figure out how to make this user-specific (only those recieving the email can access this and use it correctly)

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Paper, Stack, Box, Text, PasswordInput, Anchor, Button, Alert } from "@mantine/core";
import { useIsMobile } from "@/app/use-is-mobile";

const inputStyles = {
  height: "2rem",
  width: "100%",
  borderRadius: "0.5rem",
  backgroundColor: "var(--mantine-color-gray-0)",
  fontFamily: "var(--mantine-font-family)",
  color: "var(--mantine-color-navy-7)",
};

export default function ResetPasswordPage() {
  const isMobile = useIsMobile();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessful, setIsSuccessful] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!newPassword || !confirmNewPassword) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSuccessful(true);
  };

  return (
    <Paper
      maw={isMobile ? "90%" : "30%"}
      bg="navy.0"
      p="2rem"
      style={{ borderRadius: "0.625rem" }}
    >
      {isSuccessful ? (
        <Stack gap="md" align="center">
          <Box
            h={100}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Image
              src="/logo.png"
              alt="LabScity Logo"
              width={200}
              height={200}
              priority
              style={{ width: "auto", height: "auto", objectFit: "contain" }}
            />
          </Box>
          <Alert color="green" title="Password Updated" w="100%">
            Your password was successfully reset.
          </Alert>
          <Button
            component={Link}
            href="/login"
            bg="navy.7"
            c="navy.0"
            fw={600}
            fz="md"
            style={{
              width: "10.46875rem",
              height: "2.5625rem",
              borderRadius: "0.46875rem",
              fontFamily: "var(--mantine-font-family)",
              "--button-hover": "var(--mantine-color-navy-6)",
            }}
          >
            Return to Login
          </Button>
        </Stack>
      ) : (
        <form onSubmit={onSubmit}>
          <Stack gap="md" align="center">
            <Box
              h={100}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Image
                src="/logo.png"
                alt="LabScity Logo"
                width={200}
                height={200}
                priority
                style={{ width: "auto", height: "auto", objectFit: "contain" }}
              />
            </Box>

            <Text fz="lg" fw={600} c="navy.7">Set your new password:</Text>

            {errorMessage && (
              <Alert color="red" title="Unable to Reset" w="100%">
                {errorMessage}
              </Alert>
            )}

            <Box
              w="100%"
              maw="18.5rem"
              style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
            >
              <Text fz="md" fw={600} c="navy.7" lh={1.5}>New Password</Text>
              <PasswordInput
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
                styles={{ input: inputStyles, root: { width: "100%" } }}
              />
            </Box>

            <Box
              w="100%"
              maw="18.5rem"
              style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
            >
              <Text fz="md" fw={600} c="navy.7" lh={1.5}>Confirm New Password</Text>
              <PasswordInput
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.currentTarget.value)}
                styles={{ input: inputStyles, root: { width: "100%" } }}
              />
            </Box>

            <Button
              type="submit"
              bg="navy.7"
              c="navy.0"
              fw={600}
              fz="md"
              style={{
                width: "10.46875rem",
                height: "2.5625rem",
                borderRadius: "0.46875rem",
                fontFamily: "var(--mantine-font-family)",
                "--button-hover": "var(--mantine-color-navy-6)",
              }}
            >
              Reset Password
            </Button>

            <Text fz="sm">
              Back to{" "}
              <Anchor fz="sm" c="navy.6" component={Link} href="/login">
                Sign In
              </Anchor>
            </Text>
          </Stack>
        </form>
      )}
    </Paper>
  );
}
