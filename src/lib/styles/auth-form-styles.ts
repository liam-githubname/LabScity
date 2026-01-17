import type { MantineTheme } from "@mantine/core";
import { fontSizes, spacing, radius, components } from "@/lib/constants/design-tokens";

/**
 * Shared styles for authentication forms (login and signup)
 * Uses theme colors and design tokens for consistency
 */
export function getAuthFormStyles(theme: MantineTheme) {
  return {
    // Input field styles
    input: {
      height: spacing.inputHeight,
      width: spacing.inputWidth,
      borderRadius: radius.input,
      backgroundColor: theme.colors.gray[0], // white
      fontSize: fontSizes.input,
      fontFamily: theme.fontFamily,
      color: theme.colors.navy[8], // primary text
      "&::placeholder": {
        color: theme.colors.gray[6], // secondary text/placeholder
      },
      "&:focus": {
        borderColor: theme.colors.navy[7], // primary navy
      },
    },

    // Label styles
    label: {
      fontSize: fontSizes.label,
      fontFamily: theme.fontFamily,
      color: theme.colors.navy[8], // primary text
      fontWeight: 400,
      lineHeight: "1.5",
    },

    // Button styles
    button: {
      height: spacing.buttonHeight,
      borderRadius: radius.button,
      backgroundColor: theme.colors.navy[7], // primary navy (button background)
      color: theme.colors.navy[0], // button text (EFF4F6)
      fontSize: fontSizes.input,
      fontFamily: theme.fontFamily,
      fontWeight: 400,
      "&:hover": {
        backgroundColor: theme.colors.navy[6],
      },
      "&:active": {
        backgroundColor: theme.colors.navy[9],
      },
    },

    // Logo container styles
    logoBox: {
      width: components.logo.size,
      height: components.logo.size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    // Form container styles
    formContainer: {
      width: "100%",
      maxWidth: components.form.maxWidth,
      minHeight: components.form.minHeight,
      backgroundColor: theme.colors.navy[0], // card background (EFF4F6)
      borderRadius: radius.card,
      padding: "2rem",
    },
  } as const;
}
