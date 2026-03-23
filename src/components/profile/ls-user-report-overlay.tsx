"use client";

import {
  Modal,
  Button,
  Select,
  Textarea,
  Stack,
  Alert,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { createUserReport } from "@/lib/actions/profile";
import type { CreateUserReportValues } from "@/lib/validations/profile";
import { createUserReportSchema } from "@/lib/validations/profile";

interface LSUserReportOverlayProps {
  open: boolean;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "Impersonation", label: "Impersonation" },
  { value: "Inappropriate Name", label: "Inappropriate Name" },
  { value: "Inappropriate Profile Picture", label: "Inappropriate Profile Picture" },
  { value: "Inappropriate Banner", label: "Inappropriate Banner" },
  { value: "Spam/Scam", label: "Spam/Scam" },
  { value: "Sexual Content", label: "Sexual Content" },
  { value: "Other", label: "Other" },
];

/**
 * Overlay component for reporting a user.
 * Renders a modal with form to select report type and provide additional context.
 * Locked scroll when open (handled by Mantine Modal).
 */
export function LSUserReportOverlay({
  open,
  targetUserId,
  targetUserName,
  onClose,
}: LSUserReportOverlayProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateUserReportValues>({
    initialValues: {
      type: "" as const,
      reason: "",
    },
    validate: {
      type: (value: string) =>
        !value || value === "" ? "Report type is required" : null,
      reason: (value: string) => {
        if (!value) return "Reason is required";
        if (value.length > 2000) return "Reason must be less than 2000 characters";
        return null;
      },
    },
  });

  const handleSubmit = async (values: CreateUserReportValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Validate with Zod schema
      const validated = createUserReportSchema.parse(values);

      const result = await createUserReport(targetUserId, validated);

      if (!result.success) {
        setSubmitError(result.error || "Failed to submit report");
        return;
      }

      // Success: reset form and close
      form.reset();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={open}
      onClose={() => {
        form.reset();
        onClose();
      }}
      title={`Report ${targetUserName}`}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {submitError && (
            <Alert color="red" title="Error">
              {submitError}
            </Alert>
          )}

          <Select
            label="Report Type"
            placeholder="Select reason for report"
            data={REPORT_TYPES}
            searchable
            required
            {...form.getInputProps("type")}
          />

          <Textarea
            label="Additional Context"
            placeholder="Provide more details about why you're reporting this user..."
            minRows={4}
            required
            {...form.getInputProps("reason")}
          />

          <Group justify="space-between">
            <Button
              variant="outline"
              onClick={() => {
                form.reset();
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="red"
              loading={isSubmitting}
              disabled={!form.isValid()}
            >
              Report User
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
