"use client";

import { Paper, Stack, Box, Text, TextInput, PasswordInput, Button, Alert } from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
import classes from "./auth-form.module.css";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur", // Validate on blur (loses focus) for better UX
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupValues) => {
    setServerError(null); // Clear previous errors

    // Placeholder for server action - will be implemented later
    // Expected format: { success: boolean, error?: string }
    try {
      // const result = await signupAction(data);
      // if (!result.success && result.error) {
      //   setServerError(result.error);
      // }
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
            <Text c="navy.0" size="xl" fw={600}>
              LS
            </Text>
          </Box>
          {serverError && (
            <Alert color="red" title="Error">
              {serverError}
            </Alert>
          )}
          <div className={classes.fieldContainer}>
            <Text className={classes.label}>First Name</Text>
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  placeholder="First Name"
                  classNames={{ input: classes.input, root: classes.inputRoot }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
          <div className={classes.fieldContainer}>
            <Text className={classes.label}>Last Name</Text>
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  placeholder="Last Name"
                  classNames={{ input: classes.input, root: classes.inputRoot }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
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
              render={({ field, fieldState }) => (
                <PasswordInput
                  {...field}
                  placeholder="Password"
                  classNames={{ input: classes.input, root: classes.inputRoot }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
          <div className={classes.fieldContainer}>
            <Text className={classes.label}>Confirm Password</Text>
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <PasswordInput
                  {...field}
                  placeholder="Confirm Password"
                  classNames={{ input: classes.input, root: classes.inputRoot }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
          <Button
            type="submit"
            className={classes.button}
            loading={form.formState.isSubmitting}
          >
            Create Account
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
