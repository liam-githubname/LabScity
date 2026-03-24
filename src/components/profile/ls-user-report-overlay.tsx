"use client";

import {
  Modal,
  Button,
  Select,
  Textarea,
  Stack,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
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
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CreateUserReportValues>({
    resolver: zodResolver(createUserReportSchema),
    mode: "onChange",
    defaultValues: { type: "", reason: "" },
  });

  const reportMutation = useMutation({
    mutationFn: async (values: CreateUserReportValues) => {
      const result = await createUserReport(targetUserId, values);
      if (!result.success) throw new Error(result.error ?? "Failed to submit report");
      return result;
    },
    onSuccess: () => {
      reset();
      onClose();
      notifications.show({
        title: "Report submitted",
        message: "Thank you. We will review this report.",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Could not submit report",
        message: error instanceof Error ? error.message : "Something went wrong",
        color: "red",
      });
    },
  });

  return (
    <Modal
      opened={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Report ${targetUserName}`}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit((values) => reportMutation.mutateAsync(values))}>
        <Stack gap="md">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label="Report Type"
                placeholder="Select reason for report"
                data={REPORT_TYPES}
                searchable
                required
                value={field.value || ""}
                onChange={(value) => field.onChange(value ?? "")}
                error={errors.type?.message}
              />
            )}
          />

          <Textarea
            label="Additional Context"
            placeholder="Provide more details about why you're reporting this user..."
            minRows={4}
            required
            error={errors.reason?.message}
            {...register("reason")}
          />

          <Group justify="space-between">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={reportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="red"
              loading={reportMutation.isPending}
              disabled={!isValid}
            >
              Report User
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
