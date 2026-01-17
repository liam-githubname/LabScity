"use client";

import { Paper, Stack } from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import classes from "./auth-form.module.css";

export function LoginForm() {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Paper className={classes.formContainer}>
      <Stack gap="md">
        {/* Form fields will be added in subsequent steps */}
      </Stack>
    </Paper>
  );
}