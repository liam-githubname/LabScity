"use client";

import { Paper, Stack, useMantineTheme } from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { getAuthFormStyles } from "@/lib/styles/auth-form-styles";

export function LoginForm() {
  const theme = useMantineTheme();
  const styles = getAuthFormStyles(theme);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Paper style={styles.formContainer}>
      <Stack gap="md">
        {/* Form fields will be added in subsequent steps */}
      </Stack>
    </Paper>
  );
}