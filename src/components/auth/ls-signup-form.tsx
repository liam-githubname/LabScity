"use client";

import { Paper, Stack, Box, Text, TextInput, PasswordInput, Anchor, Button, Alert } from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
import type { signupAction } from "@/lib/actions/auth";
import { useIsMobile } from "@/app/use-is-mobile";

type SignupAction = typeof signupAction;

const inputStyles = {
  height: "2rem",
  width: "100%",
  borderRadius: "0.5rem",
  backgroundColor: "var(--mantine-color-gray-0)",
  fontFamily: "var(--mantine-font-family)",
  color: "var(--mantine-color-navy-7)",
};

export function LSSignupForm({
  signupAction
}: {
  signupAction: SignupAction
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur", // Validate on blur (loses focus) for better UX
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      occupation: "",
      workplace: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupValues) => {
    setServerError(null); // Clear previous errors
    setSuccessMessage(null); // Clear previous success message

    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("occupation", data.occupation);
      formData.append("workplace", data.workplace);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await signupAction(formData);
      if (!result.success && result.error) {
        setServerError(result.error);
        return;
      }

      setSuccessMessage("Check your email to verify your account before signing in.");
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  // check if we are on mobile to change some layout stuff around
  const isMobile = useIsMobile()

  return (
    <Paper
      miw={400}
      maw={isMobile ? "500px" : "700px"} // limit box size on larger screen 
      bg="navy.0"
      p="1rem 3rem"
      style={{ borderRadius: "0.625rem" }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="md" align="center">
          <Box
            h={100}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Image
              src="/logo.png"
              alt="LabScity Logo"
              width={320}
              height={108}
              priority
              style={{ width: "auto", height: "auto", objectFit: "contain" }}
            />
          </Box>
          {serverError && (
            <Alert color="red" title="Error">
              {serverError}
            </Alert>
          )}
          {successMessage && (
            <Alert color="green" title="Success">
              {successMessage}
            </Alert>
          )}
          <Box
            w="100%"
            maw="18.5rem"
            style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
          >
            <Text fz="md" fw={600} c="navy.7" lh={1.5}>First Name</Text>
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  styles={{ input: inputStyles, root: { width: "100%" } }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Box
            w="100%"
            maw="18.5rem"
            style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
          >
            <Text fz="md" fw={600} c="navy.7" lh={1.5}>Last Name</Text>
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}

                  styles={{ input: inputStyles, root: { width: "100%" } }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Box
            w="100%"
            maw="18.5rem"
            style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
          >
            <Text fz="md" fw={600} c="navy.7" lh={1.5}>Email</Text>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  styles={{ input: inputStyles, root: { width: "100%" } }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Box
            w="100%"
            maw="18.5rem"
            style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
          >
            <Text fz="md" fw={600} c="navy.7" lh={1.5}>Occupation</Text>
            <Controller
              name="occupation"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  styles={{ input: inputStyles, root: { width: "100%" } }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Box
            w="100%"
            maw="18.5rem"
            style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
          >
            <Text fz="md" fw={600} c="navy.7" lh={1.5}>Workplace</Text>
            <Controller
              name="workplace"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  styles={{ input: inputStyles, root: { width: "100%" } }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Box
            w="100%"
            maw="18.5rem"
            style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
          >
            <Text fz="md" fw={600} c="navy.7" lh={1.5}>Password</Text>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <PasswordInput
                  {...field}
                  styles={{ input: inputStyles, root: { width: "100%" } }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Box
            w="100%"
            maw="18.5rem"
            style={{ display: "flex", flexDirection: "column", gap: "0.1rem", alignItems: "flex-start" }}
          >
            <Text fz="md" fw={600} c="navy.7" lh={1.5}>Confirm Password</Text>
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <PasswordInput
                  {...field}
                  styles={{ input: inputStyles, root: { width: "100%" } }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
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
            Create Account
          </Button>
          <Text fz="sm">
            Already have an account?{" "}
            <Anchor fz="sm" c="navy.6" component={Link} href="/login">
              Sign In
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
