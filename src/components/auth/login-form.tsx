"use client";

import { Paper, Stack, Box, Text, TextInput, PasswordInput, Anchor, Button, Alert } from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import classes from "./auth-form.module.css";

import { loginAction } from "@/lib/actions/auth";


export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // Validate on blur (loses focus) for better UX
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginValues) => {
    setServerError(null); // Clear previous errors

    // Placeholder for server action - will be implemented later
    // Expected format: { success: boolean, error?: string }
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      const result = await loginAction(formData);
      if (!result.success && result.error) {
        setServerError(result.error);
      }
      console.log("Form submitted:", data); // delete this later
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Paper className={classes.formContainer}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="md" align="center">
        <Box className={classes.logoBox}>
          <Image 
            src="/logo.png" 
            alt="LabScity Logo" 
            width={200}
            height={200}
            priority
          />
        </Box>
        {serverError && (
          <Alert color="red" title="Error">
            {serverError}
          </Alert>
        )}
        <div className={classes.fieldContainer}>
          <Text className={classes.label}>Email</Text>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                placeholder="Email"
                classNames={{ input: classes.input, root: classes.inputRoot }}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <div className={classes.fieldContainer}>
          <Text className={classes.label}>Password</Text>
          <Controller
            name="password"
            control={form.control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                placeholder="Password"
                classNames={{ input: classes.input, root: classes.inputRoot }}
              />
            )}
          />
        </div>
        <Anchor component={Link} href="/forgot-password">
          Forgot Password?
        </Anchor>
        <Button
          type="submit"
          className={classes.button}
          loading={form.formState.isSubmitting}
        >
          Sign In
        </Button>
        <Text>
          Don't have an account?{" "}
          <Anchor component={Link} href="/signup">
            Sign Up
          </Anchor>
        </Text>
        </Stack>
      </form>
    </Paper>
  );
}
